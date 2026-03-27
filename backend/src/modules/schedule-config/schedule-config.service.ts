import type { PrismaClient } from "@prisma/client";
import { HttpError } from "../../utils/http-error.js";
import {
  DEFAULT_ACADEMIC_CONFIG,
  DEFAULT_SCHEDULING_RULES,
  DEFAULT_TIME_BLOCKS,
  DEFAULT_TIME_SLOT_GROUPS
} from "./schedule-config.defaults.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type TimeSlotGroupInput = {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  activo?: boolean;
};

type TimeBlockInput = {
  grupoId: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  orden: number;
  activo?: boolean;
};

type SchedulingRuleInput = {
  clave: string;
  valor: string | number | boolean | string[];
  tipo: "boolean" | "number" | "string" | "json";
  descripcion?: string;
  activo?: boolean;
};

type AcademicConfigInput = {
  nombre: string;
  sesionesPorSemanaDefault: number;
  duracionSesionDefault: number;
  diasHabiles: string[];
  activo?: boolean;
};

const positiveNumberRuleKeys = new Set(["MAX_HORAS_DOCENTE", "DESCANSO_MINIMO_MINUTOS"]);

function parseTimeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatRuleValue(value: string | number | boolean | string[], tipo: SchedulingRuleInput["tipo"]) {
  if (tipo === "json") {
    return JSON.stringify(value);
  }

  return String(value);
}

function parseRuleValue(value: string, tipo: SchedulingRuleInput["tipo"]) {
  if (tipo === "boolean") return value === "true";
  if (tipo === "number") return Number(value);
  if (tipo === "json") return JSON.parse(value);
  return value;
}

export class ScheduleConfigService {
  constructor(private readonly prisma: PrismaClient) {}

  async listTimeSlotGroups() {
    await this.ensureDefaults();

    const groups = await this.prisma.timeSlotGroup.findMany({
      include: {
        timeBlocks: {
          orderBy: { orden: "asc" }
        }
      },
      orderBy: { horaInicio: "asc" }
    });

    return groups.map((group) => ({
      ...group,
      timeBlocks: group.timeBlocks.map((block) => ({
        ...block,
        grupoNombre: group.nombre
      }))
    }));
  }

  async createTimeSlotGroup(input: TimeSlotGroupInput, meta: RequestMeta) {
    this.validateTimeRange(input.horaInicio, input.horaFin, "La franja debe tener una hora fin posterior a la hora inicio");
    await this.ensureUniqueGroupName(input.nombre);

    const group = await this.prisma.timeSlotGroup.create({
      data: {
        nombre: input.nombre,
        horaInicio: input.horaInicio,
        horaFin: input.horaFin,
        activo: input.activo ?? true
      }
    });

    await this.createAuditLog(meta.userId ?? null, "schedule_config.time_slot_group.create", meta, { groupId: group.id });
    return group;
  }

  async updateTimeSlotGroup(id: string, input: TimeSlotGroupInput, meta: RequestMeta) {
    this.validateTimeRange(input.horaInicio, input.horaFin, "La franja debe tener una hora fin posterior a la hora inicio");

    const current = await this.prisma.timeSlotGroup.findUnique({
      where: { id },
      include: { timeBlocks: true }
    });

    if (!current) {
      throw new HttpError(404, "Franja no encontrada", "TIME_SLOT_GROUP_NOT_FOUND");
    }

    await this.ensureUniqueGroupName(input.nombre, id);
    current.timeBlocks.forEach((block) => {
      this.validateNestedRange(input.horaInicio, input.horaFin, block.horaInicio, block.horaFin);
    });

    const updated = await this.prisma.timeSlotGroup.update({
      where: { id },
      data: {
        nombre: input.nombre,
        horaInicio: input.horaInicio,
        horaFin: input.horaFin,
        activo: input.activo ?? current.activo
      }
    });

    await this.createAuditLog(meta.userId ?? null, "schedule_config.time_slot_group.update", meta, { groupId: id });
    return updated;
  }

  async deleteTimeSlotGroup(id: string, meta: RequestMeta) {
    const existing = await this.prisma.timeSlotGroup.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Franja no encontrada", "TIME_SLOT_GROUP_NOT_FOUND");
    }

    await this.prisma.timeSlotGroup.delete({ where: { id } });
    await this.createAuditLog(meta.userId ?? null, "schedule_config.time_slot_group.delete", meta, { groupId: id });
  }

  async listTimeBlocks() {
    await this.ensureDefaults();

    const blocks = await this.prisma.timeBlock.findMany({
      include: { grupo: true },
      orderBy: [{ orden: "asc" }, { horaInicio: "asc" }]
    });

    return blocks.map((block) => ({
      ...block,
      grupoNombre: block.grupo.nombre
    }));
  }

  async createTimeBlock(input: TimeBlockInput, meta: RequestMeta) {
    this.validateTimeRange(input.horaInicio, input.horaFin, "El bloque debe tener una hora fin posterior a la hora inicio");
    const group = await this.requireGroup(input.grupoId);
    this.validateNestedRange(group.horaInicio, group.horaFin, input.horaInicio, input.horaFin);
    await this.ensureUniqueBlockOrder(input.grupoId, input.orden);
    await this.ensureNoOverlap(input.grupoId, input.horaInicio, input.horaFin);

    const block = await this.prisma.timeBlock.create({
      data: {
        grupoId: input.grupoId,
        nombre: input.nombre,
        horaInicio: input.horaInicio,
        horaFin: input.horaFin,
        duracionMinutos: parseTimeToMinutes(input.horaFin) - parseTimeToMinutes(input.horaInicio),
        orden: input.orden,
        activo: input.activo ?? true
      },
      include: { grupo: true }
    });

    await this.createAuditLog(meta.userId ?? null, "schedule_config.time_block.create", meta, { blockId: block.id });
    return {
      ...block,
      grupoNombre: block.grupo.nombre
    };
  }

  async updateTimeBlock(id: string, input: TimeBlockInput, meta: RequestMeta) {
    this.validateTimeRange(input.horaInicio, input.horaFin, "El bloque debe tener una hora fin posterior a la hora inicio");

    const current = await this.prisma.timeBlock.findUnique({
      where: { id },
      include: { grupo: true }
    });

    if (!current) {
      throw new HttpError(404, "Bloque no encontrado", "TIME_BLOCK_NOT_FOUND");
    }

    const group = await this.requireGroup(input.grupoId);
    this.validateNestedRange(group.horaInicio, group.horaFin, input.horaInicio, input.horaFin);
    await this.ensureUniqueBlockOrder(input.grupoId, input.orden, id);
    await this.ensureNoOverlap(input.grupoId, input.horaInicio, input.horaFin, id);

    const updated = await this.prisma.timeBlock.update({
      where: { id },
      data: {
        grupoId: input.grupoId,
        nombre: input.nombre,
        horaInicio: input.horaInicio,
        horaFin: input.horaFin,
        duracionMinutos: parseTimeToMinutes(input.horaFin) - parseTimeToMinutes(input.horaInicio),
        orden: input.orden,
        activo: input.activo ?? current.activo
      },
      include: { grupo: true }
    });

    await this.createAuditLog(meta.userId ?? null, "schedule_config.time_block.update", meta, { blockId: id });
    return {
      ...updated,
      grupoNombre: updated.grupo.nombre
    };
  }

  async deleteTimeBlock(id: string, meta: RequestMeta) {
    const existing = await this.prisma.timeBlock.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Bloque no encontrado", "TIME_BLOCK_NOT_FOUND");
    }

    await this.prisma.timeBlock.delete({ where: { id } });
    await this.createAuditLog(meta.userId ?? null, "schedule_config.time_block.delete", meta, { blockId: id });
  }

  async listRules() {
    await this.ensureDefaults();
    const rules = await this.prisma.schedulingRule.findMany({ orderBy: { clave: "asc" } });

    return rules.map((rule) => ({
      ...rule,
      valor: parseRuleValue(rule.valor, rule.tipo as SchedulingRuleInput["tipo"])
    }));
  }

  async updateRules(input: SchedulingRuleInput[], meta: RequestMeta) {
    await this.ensureDefaults();

    for (const rule of input) {
      this.validateRule(rule);
    }

    await this.prisma.$transaction(
      input.map((rule) =>
        this.prisma.schedulingRule.upsert({
          where: { clave: rule.clave },
          update: {
            valor: formatRuleValue(rule.valor, rule.tipo),
            tipo: rule.tipo,
            descripcion: rule.descripcion ?? null,
            activo: rule.activo ?? true
          },
          create: {
            clave: rule.clave,
            valor: formatRuleValue(rule.valor, rule.tipo),
            tipo: rule.tipo,
            descripcion: rule.descripcion ?? null,
            activo: rule.activo ?? true
          }
        })
      )
    );

    await this.createAuditLog(meta.userId ?? null, "schedule_config.rules.update", meta, { total: input.length });
    return this.listRules();
  }

  async getAcademicConfig() {
    await this.ensureDefaults();
    const config = await this.prisma.academicConfig.findFirst({ orderBy: { createdAt: "asc" } });
    if (!config) {
      throw new HttpError(404, "Configuracion academica no encontrada", "ACADEMIC_CONFIG_NOT_FOUND");
    }

    return config;
  }

  async updateAcademicConfig(input: AcademicConfigInput, meta: RequestMeta) {
    await this.ensureDefaults();

    if (input.sesionesPorSemanaDefault < 1) {
      throw new HttpError(400, "Las sesiones por semana deben ser mayores a cero", "INVALID_ACADEMIC_CONFIG");
    }

    if (input.duracionSesionDefault < 1) {
      throw new HttpError(400, "La duracion de la sesion debe ser mayor a cero", "INVALID_ACADEMIC_CONFIG");
    }

    const config = await this.prisma.academicConfig.findFirst({ orderBy: { createdAt: "asc" } });
    if (!config) {
      throw new HttpError(404, "Configuracion academica no encontrada", "ACADEMIC_CONFIG_NOT_FOUND");
    }

    const updated = await this.prisma.academicConfig.update({
      where: { id: config.id },
      data: {
        nombre: input.nombre,
        sesionesPorSemanaDefault: input.sesionesPorSemanaDefault,
        duracionSesionDefault: input.duracionSesionDefault,
        diasHabiles: input.diasHabiles,
        activo: input.activo ?? config.activo
      }
    });

    await this.createAuditLog(meta.userId ?? null, "schedule_config.academic_config.update", meta, { configId: config.id });
    return updated;
  }

  private async ensureDefaults() {
    const [groupCount, ruleCount, configCount] = await Promise.all([
      this.prisma.timeSlotGroup.count(),
      this.prisma.schedulingRule.count(),
      this.prisma.academicConfig.count()
    ]);

    if (groupCount === 0) {
      await this.prisma.$transaction(async (tx) => {
        const createdGroups = [];
        for (const group of DEFAULT_TIME_SLOT_GROUPS) {
          const created = await tx.timeSlotGroup.create({ data: group });
          createdGroups.push(created);
        }

        for (const group of createdGroups) {
          const blocks = DEFAULT_TIME_BLOCKS[group.nombre as keyof typeof DEFAULT_TIME_BLOCKS] ?? [];
          for (const block of blocks) {
            await tx.timeBlock.create({
              data: {
                grupoId: group.id,
                nombre: block.nombre,
                horaInicio: block.horaInicio,
                horaFin: block.horaFin,
                duracionMinutos: parseTimeToMinutes(block.horaFin) - parseTimeToMinutes(block.horaInicio),
                orden: block.orden,
                activo: block.activo
              }
            });
          }
        }
      });
    }

    if (ruleCount === 0) {
      await this.prisma.schedulingRule.createMany({
        data: DEFAULT_SCHEDULING_RULES.map((rule) => ({
          ...rule,
          tipo: rule.tipo as any
        }))
      });
    }

    if (configCount === 0) {
      await this.prisma.academicConfig.create({ data: DEFAULT_ACADEMIC_CONFIG });
    }
  }

  private validateTimeRange(start: string, end: string, message: string) {
    if (parseTimeToMinutes(end) <= parseTimeToMinutes(start)) {
      throw new HttpError(400, message, "INVALID_TIME_RANGE");
    }
  }

  private validateNestedRange(groupStart: string, groupEnd: string, blockStart: string, blockEnd: string) {
    const blockStartMinutes = parseTimeToMinutes(blockStart);
    const blockEndMinutes = parseTimeToMinutes(blockEnd);
    const groupStartMinutes = parseTimeToMinutes(groupStart);
    const groupEndMinutes = parseTimeToMinutes(groupEnd);

    if (blockStartMinutes < groupStartMinutes || blockEndMinutes > groupEndMinutes) {
      throw new HttpError(400, "El bloque debe estar contenido dentro de la franja", "BLOCK_OUTSIDE_GROUP");
    }
  }

  private async ensureUniqueGroupName(nombre: string, excludeId?: string) {
    const existing = await this.prisma.timeSlotGroup.findFirst({
      where: {
        nombre,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });

    if (existing) {
      throw new HttpError(409, "Ya existe una franja con ese nombre", "TIME_SLOT_GROUP_NAME_TAKEN");
    }
  }

  private async requireGroup(grupoId: string) {
    const group = await this.prisma.timeSlotGroup.findUnique({ where: { id: grupoId } });
    if (!group) {
      throw new HttpError(404, "Franja no encontrada", "TIME_SLOT_GROUP_NOT_FOUND");
    }

    return group;
  }

  private async ensureUniqueBlockOrder(grupoId: string, orden: number, excludeId?: string) {
    const existing = await this.prisma.timeBlock.findFirst({
      where: {
        grupoId,
        orden,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });

    if (existing) {
      throw new HttpError(409, "Ya existe un bloque con ese orden en la franja seleccionada", "TIME_BLOCK_ORDER_TAKEN");
    }
  }

  private async ensureNoOverlap(grupoId: string, horaInicio: string, horaFin: string, excludeId?: string) {
    const existingBlocks = await this.prisma.timeBlock.findMany({
      where: {
        grupoId,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });

    const start = parseTimeToMinutes(horaInicio);
    const end = parseTimeToMinutes(horaFin);

    for (const block of existingBlocks) {
      const existingStart = parseTimeToMinutes(block.horaInicio);
      const existingEnd = parseTimeToMinutes(block.horaFin);
      const overlaps = start < existingEnd && end > existingStart;
      if (overlaps) {
        throw new HttpError(400, "El bloque se solapa con otro bloque activo de la misma franja", "TIME_BLOCK_OVERLAP");
      }
    }
  }

  private validateRule(rule: SchedulingRuleInput) {
    if (rule.tipo === "number") {
      const numericValue = Number(rule.valor);
      if (Number.isNaN(numericValue)) {
        throw new HttpError(400, `La regla ${rule.clave} requiere un valor numerico`, "INVALID_RULE_VALUE");
      }

      if (positiveNumberRuleKeys.has(rule.clave) && numericValue <= 0) {
        throw new HttpError(400, `La regla ${rule.clave} debe ser mayor a cero`, "INVALID_RULE_VALUE");
      }
    }

    if (rule.tipo === "boolean" && typeof rule.valor !== "boolean") {
      throw new HttpError(400, `La regla ${rule.clave} requiere un valor booleano`, "INVALID_RULE_VALUE");
    }
  }

  private async createAuditLog(userId: string | null, action: string, meta: RequestMeta, details?: Record<string, unknown>) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        ...(details ? { details: details as any } : {})
      }
    });
  }
}
