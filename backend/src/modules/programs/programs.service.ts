import type { PrismaClient } from "@prisma/client";
import { audit } from "../../utils/audit.js";
import { HttpError } from "../../utils/http-error.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type ProgramInput = {
  codigo: string;
  nombre: string;
  departamento: string;
  activo?: boolean;
};

export class ProgramsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listPrograms(filters: { deleted?: boolean; search?: string } = {}) {
    const search = filters.search?.trim();
    const items = await this.prisma.program.findMany({
      where: {
        ...(filters.deleted ? { deletedAt: { not: null } } : {}),
        ...(search
          ? {
              OR: [
                { nombre: { contains: search, mode: "insensitive" } },
                { codigo: { contains: search, mode: "insensitive" } },
                { departamento: { contains: search, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [{ departamento: "asc" }, { nombre: "asc" }]
    });
    return items.map((p) => this.toSummary(p));
  }

  async getProgramById(id: string) {
    const item = await this.prisma.program.findFirst({ where: { id } });
    if (!item) {
      throw new HttpError(404, "Programa no encontrado", "PROGRAM_NOT_FOUND");
    }
    return this.toSummary(item);
  }

  async createProgram(input: ProgramInput, meta: RequestMeta) {
    await this.ensureUniqueCode(input.codigo);
    const item = await this.prisma.program.create({
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        departamento: input.departamento,
        activo: input.activo ?? true
      }
    });
    await audit(this.prisma, meta, {
      action: "programs.create",
      entityType: "program",
      entityId: item.id,
      after: { id: item.id, codigo: item.codigo }
    });
    return this.toSummary(item);
  }

  async updateProgram(id: string, input: ProgramInput, meta: RequestMeta) {
    const existing = await this.requireProgram(id);
    await this.ensureUniqueCode(input.codigo, id);
    const item = await this.prisma.program.update({
      where: { id },
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        departamento: input.departamento,
        activo: input.activo ?? existing.activo
      }
    });
    await audit(this.prisma, meta, { action: "programs.update", entityType: "program", entityId: id });
    return this.toSummary(item);
  }

  async deleteProgram(id: string, meta: RequestMeta) {
    const existing = await this.requireProgram(id);
    if (existing.deletedAt) {
      throw new HttpError(409, "El programa ya fue eliminado", "PROGRAM_ALREADY_DELETED");
    }
    const students = await this.prisma.student.count({ where: { programId: id } });
    if (students > 0) {
      throw new HttpError(
        409,
        `El programa tiene ${students} estudiante(s) asociados. Reasigne o elimine primero.`,
        "PROGRAM_HAS_STUDENTS"
      );
    }
    const now = new Date();
    await this.prisma.program.update({
      where: { id },
      data: { deletedAt: now, deletedBy: meta.userId ?? null }
    });
    await audit(this.prisma, meta, {
      action: "programs.softDelete",
      entityType: "program",
      entityId: id,
      before: { id, codigo: existing.codigo },
      after: { id, deletedAt: now.toISOString(), deletedBy: meta.userId ?? null }
    });
  }

  async restoreProgram(id: string, meta: RequestMeta) {
    const existing = await this.prisma.program.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Programa no encontrado", "PROGRAM_NOT_FOUND");
    }
    if (!existing.deletedAt) {
      throw new HttpError(409, "El programa no esta eliminado", "PROGRAM_NOT_DELETED");
    }
    const conflict = await this.prisma.program.findUnique({ where: { codigo: existing.codigo } });
    if (conflict && conflict.id !== id) {
      throw new HttpError(409, "Otro programa activo ya usa este codigo.", "CODIGO_CONFLICT_ON_RESTORE");
    }
    await this.prisma.program.update({ where: { id }, data: { deletedAt: null, deletedBy: null } });
    await audit(this.prisma, meta, { action: "programs.restore", entityType: "program", entityId: id });
    return this.getProgramById(id);
  }

  private async requireProgram(id: string) {
    const item = await this.prisma.program.findFirst({ where: { id } });
    if (!item) {
      throw new HttpError(404, "Programa no encontrado", "PROGRAM_NOT_FOUND");
    }
    return item;
  }

  private async ensureUniqueCode(codigo: string, excludeId?: string) {
    const existing = await this.prisma.program.findUnique({ where: { codigo } });
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "Ya existe un programa con ese codigo", "PROGRAM_CODE_TAKEN");
    }
  }

  private toSummary(p: {
    id: string;
    codigo: string;
    nombre: string;
    departamento: string;
    activo: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      departamento: p.departamento,
      activo: p.activo,
      deletedAt: p.deletedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    };
  }
}
