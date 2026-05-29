import type { PrismaClient } from "@prisma/client";
import { audit } from "../../utils/audit.js";
import { HttpError } from "../../utils/http-error.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type PeriodInput = {
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  esActual?: boolean;
  activo?: boolean;
};

export class AcademicPeriodsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listPeriods(filters: { deleted?: boolean } = {}) {
    const items = await this.prisma.academicPeriod.findMany({
      where: { ...(filters.deleted ? { deletedAt: { not: null } } : {}) },
      orderBy: [{ fechaInicio: "desc" }]
    });
    return items.map((p) => this.toSummary(p));
  }

  async getPeriodById(id: string) {
    const item = await this.prisma.academicPeriod.findFirst({ where: { id } });
    if (!item) {
      throw new HttpError(404, "Periodo no encontrado", "PERIOD_NOT_FOUND");
    }
    return this.toSummary(item);
  }

  async createPeriod(input: PeriodInput, meta: RequestMeta) {
    this.validateDates(input.fechaInicio, input.fechaFin);
    await this.ensureUniqueCode(input.codigo);

    const item = await this.prisma.$transaction(async (tx) => {
      if (input.esActual) {
        await tx.academicPeriod.updateMany({ where: { esActual: true }, data: { esActual: false } });
      }
      return tx.academicPeriod.create({
        data: {
          codigo: input.codigo,
          nombre: input.nombre,
          fechaInicio: new Date(input.fechaInicio),
          fechaFin: new Date(input.fechaFin),
          esActual: input.esActual ?? false,
          activo: input.activo ?? true
        }
      });
    });

    await audit(this.prisma, meta, {
      action: "academic-periods.create",
      entityType: "academicPeriod",
      entityId: item.id,
      after: { id: item.id, codigo: item.codigo }
    });
    return this.toSummary(item);
  }

  async updatePeriod(id: string, input: PeriodInput, meta: RequestMeta) {
    const existing = await this.requirePeriod(id);
    this.validateDates(input.fechaInicio, input.fechaFin);
    await this.ensureUniqueCode(input.codigo, id);

    const item = await this.prisma.$transaction(async (tx) => {
      if (input.esActual) {
        await tx.academicPeriod.updateMany({ where: { esActual: true, id: { not: id } }, data: { esActual: false } });
      }
      return tx.academicPeriod.update({
        where: { id },
        data: {
          codigo: input.codigo,
          nombre: input.nombre,
          fechaInicio: new Date(input.fechaInicio),
          fechaFin: new Date(input.fechaFin),
          esActual: input.esActual ?? existing.esActual,
          activo: input.activo ?? existing.activo
        }
      });
    });

    await audit(this.prisma, meta, {
      action: "academic-periods.update",
      entityType: "academicPeriod",
      entityId: id
    });
    return this.toSummary(item);
  }

  async deletePeriod(id: string, meta: RequestMeta) {
    const existing = await this.requirePeriod(id);
    if (existing.deletedAt) {
      throw new HttpError(409, "El periodo ya fue eliminado", "PERIOD_ALREADY_DELETED");
    }

    // Bloqueo: periodo con secciones o inscripciones asociadas.
    const [sections, enrollments] = await Promise.all([
      this.prisma.courseSection.count({ where: { periodoId: id } }),
      this.prisma.enrollment.count({ where: { periodoId: id } })
    ]);
    if (sections > 0 || enrollments > 0) {
      throw new HttpError(
        409,
        `El periodo tiene ${sections} seccion(es) y ${enrollments} inscripcion(es) asociadas.`,
        "PERIOD_HAS_DEPENDENCIES"
      );
    }

    const now = new Date();
    await this.prisma.academicPeriod.update({
      where: { id },
      data: { deletedAt: now, deletedBy: meta.userId ?? null, esActual: false }
    });

    await audit(this.prisma, meta, {
      action: "academic-periods.softDelete",
      entityType: "academicPeriod",
      entityId: id,
      before: { id, codigo: existing.codigo, esActual: existing.esActual },
      after: { id, deletedAt: now.toISOString(), deletedBy: meta.userId ?? null }
    });
  }

  async restorePeriod(id: string, meta: RequestMeta) {
    const existing = await this.prisma.academicPeriod.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Periodo no encontrado", "PERIOD_NOT_FOUND");
    }
    if (!existing.deletedAt) {
      throw new HttpError(409, "El periodo no esta eliminado", "PERIOD_NOT_DELETED");
    }
    const conflict = await this.prisma.academicPeriod.findUnique({ where: { codigo: existing.codigo } });
    if (conflict && conflict.id !== id) {
      throw new HttpError(409, "Otro periodo activo ya usa este codigo.", "CODIGO_CONFLICT_ON_RESTORE");
    }

    await this.prisma.academicPeriod.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null }
    });

    await audit(this.prisma, meta, {
      action: "academic-periods.restore",
      entityType: "academicPeriod",
      entityId: id
    });
    return this.getPeriodById(id);
  }

  async setCurrentPeriod(id: string, meta: RequestMeta) {
    const existing = await this.requirePeriod(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.academicPeriod.updateMany({ where: { esActual: true, id: { not: id } }, data: { esActual: false } });
      await tx.academicPeriod.update({ where: { id }, data: { esActual: true } });
    });

    await audit(this.prisma, meta, {
      action: "academic-periods.setCurrent",
      entityType: "academicPeriod",
      entityId: id,
      after: { id, codigo: existing.codigo, esActual: true }
    });
    return this.getPeriodById(id);
  }

  private async requirePeriod(id: string) {
    const item = await this.prisma.academicPeriod.findFirst({ where: { id } });
    if (!item) {
      throw new HttpError(404, "Periodo no encontrado", "PERIOD_NOT_FOUND");
    }
    return item;
  }

  private async ensureUniqueCode(codigo: string, excludeId?: string) {
    const existing = await this.prisma.academicPeriod.findUnique({ where: { codigo } });
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "Ya existe un periodo con ese codigo", "PERIOD_CODE_TAKEN");
    }
  }

  private validateDates(inicio: string, fin: string) {
    if (new Date(fin) <= new Date(inicio)) {
      throw new HttpError(400, "La fecha fin debe ser posterior a la fecha inicio", "INVALID_PERIOD_RANGE");
    }
  }

  private toSummary(p: {
    id: string;
    codigo: string;
    nombre: string;
    fechaInicio: Date;
    fechaFin: Date;
    esActual: boolean;
    activo: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      esActual: p.esActual,
      activo: p.activo,
      deletedAt: p.deletedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    };
  }
}
