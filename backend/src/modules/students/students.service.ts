import type { Prisma, PrismaClient } from "@prisma/client";
import { audit } from "../../utils/audit.js";
import { HttpError } from "../../utils/http-error.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type StudentStatus = "activo" | "egresado" | "retirado" | "suspendido";

type StudentInput = {
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  userId?: string;
  programId?: string;
  estado?: StudentStatus;
};

type ListFilters = {
  search?: string;
  programId?: string;
  estado?: StudentStatus;
  deleted?: boolean;
  page?: number;
  pageSize?: number;
};

export class StudentsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listStudents(filters: ListFilters = {}) {
    const search = filters.search?.trim();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;

    const where: Prisma.StudentWhereInput = {
      ...(filters.deleted ? { deletedAt: { not: null } } : {}),
      ...(filters.programId ? { programId: filters.programId } : {}),
      ...(filters.estado ? { estado: filters.estado } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: "insensitive" } },
              { apellido: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { codigo: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: { program: true },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.student.count({ where })
    ]);

    return {
      items: items.map((s) => this.toSummary(s)),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    };
  }

  async getStudentById(id: string) {
    const item = await this.prisma.student.findFirst({
      where: { id },
      include: { program: true }
    });
    if (!item) {
      throw new HttpError(404, "Estudiante no encontrado", "STUDENT_NOT_FOUND");
    }
    return this.toSummary(item);
  }

  async createStudent(input: StudentInput, meta: RequestMeta) {
    await this.ensureUniqueCode(input.codigo);
    await this.ensureUniqueEmail(input.email);
    await this.validateRefs(input);

    const item = await this.prisma.student.create({
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        userId: input.userId ?? null,
        programId: input.programId ?? null,
        estado: input.estado ?? "activo"
      },
      include: { program: true }
    });

    await audit(this.prisma, meta, {
      action: "students.create",
      entityType: "student",
      entityId: item.id,
      after: { id: item.id, codigo: item.codigo, email: item.email }
    });
    return this.toSummary(item);
  }

  async updateStudent(id: string, input: StudentInput, meta: RequestMeta) {
    const existing = await this.requireStudent(id);
    await this.ensureUniqueCode(input.codigo, id);
    await this.ensureUniqueEmail(input.email, id);
    await this.validateRefs(input, id);

    const item = await this.prisma.student.update({
      where: { id },
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        userId: input.userId ?? null,
        programId: input.programId ?? null,
        estado: input.estado ?? existing.estado
      },
      include: { program: true }
    });

    await audit(this.prisma, meta, { action: "students.update", entityType: "student", entityId: id });
    return this.toSummary(item);
  }

  async deleteStudent(id: string, meta: RequestMeta) {
    const existing = await this.requireStudent(id);
    if (existing.deletedAt) {
      throw new HttpError(409, "El estudiante ya fue eliminado", "STUDENT_ALREADY_DELETED");
    }
    const activeEnrollments = await this.prisma.enrollment.count({
      where: { studentId: id, estado: "inscrito" }
    });
    if (activeEnrollments > 0) {
      throw new HttpError(
        409,
        `El estudiante tiene ${activeEnrollments} inscripcion(es) activa(s). Retire las inscripciones antes de eliminar.`,
        "STUDENT_HAS_ENROLLMENTS"
      );
    }

    const now = new Date();
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: now, deletedBy: meta.userId ?? null }
    });

    await audit(this.prisma, meta, {
      action: "students.softDelete",
      entityType: "student",
      entityId: id,
      before: { id, codigo: existing.codigo, email: existing.email },
      after: { id, deletedAt: now.toISOString(), deletedBy: meta.userId ?? null }
    });
  }

  async restoreStudent(id: string, meta: RequestMeta) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Estudiante no encontrado", "STUDENT_NOT_FOUND");
    }
    if (!existing.deletedAt) {
      throw new HttpError(409, "El estudiante no esta eliminado", "STUDENT_NOT_DELETED");
    }
    const codeConflict = await this.prisma.student.findUnique({ where: { codigo: existing.codigo } });
    if (codeConflict && codeConflict.id !== id) {
      throw new HttpError(409, "Otro estudiante activo ya usa este codigo.", "CODIGO_CONFLICT_ON_RESTORE");
    }
    const emailConflict = await this.prisma.student.findUnique({ where: { email: existing.email } });
    if (emailConflict && emailConflict.id !== id) {
      throw new HttpError(409, "Otro estudiante activo ya usa este email.", "EMAIL_CONFLICT_ON_RESTORE");
    }

    await this.prisma.student.update({ where: { id }, data: { deletedAt: null, deletedBy: null } });
    await audit(this.prisma, meta, { action: "students.restore", entityType: "student", entityId: id });
    return this.getStudentById(id);
  }

  private async requireStudent(id: string) {
    const item = await this.prisma.student.findFirst({ where: { id } });
    if (!item) {
      throw new HttpError(404, "Estudiante no encontrado", "STUDENT_NOT_FOUND");
    }
    return item;
  }

  private async ensureUniqueCode(codigo: string, excludeId?: string) {
    const existing = await this.prisma.student.findUnique({ where: { codigo } });
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "Ya existe un estudiante con ese codigo", "STUDENT_CODE_TAKEN");
    }
  }

  private async ensureUniqueEmail(email: string, excludeId?: string) {
    const existing = await this.prisma.student.findUnique({ where: { email } });
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "Ya existe un estudiante con ese email", "STUDENT_EMAIL_TAKEN");
    }
  }

  private async validateRefs(input: StudentInput, excludeId?: string) {
    if (input.programId) {
      const program = await this.prisma.program.findFirst({ where: { id: input.programId } });
      if (!program) {
        throw new HttpError(400, "El programa seleccionado no existe o esta inactivo", "INVALID_PROGRAM");
      }
    }
    if (input.userId) {
      const user = await this.prisma.user.findFirst({ where: { id: input.userId } });
      if (!user) {
        throw new HttpError(400, "El usuario vinculado no existe", "INVALID_USER");
      }
      // user_id es @unique en Student: validar que no este tomado por otro
      const linked = await this.prisma.student.findUnique({ where: { userId: input.userId } });
      if (linked && linked.id !== excludeId) {
        throw new HttpError(409, "Ese usuario ya esta vinculado a otro estudiante", "USER_ALREADY_LINKED");
      }
    }
  }

  private toSummary(s: {
    id: string;
    codigo: string;
    nombre: string;
    apellido: string;
    email: string;
    userId: string | null;
    programId: string | null;
    estado: StudentStatus;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    program?: { id: string; codigo: string; nombre: string } | null;
  }) {
    return {
      id: s.id,
      codigo: s.codigo,
      nombre: s.nombre,
      apellido: s.apellido,
      email: s.email,
      userId: s.userId,
      programId: s.programId,
      program: s.program ? { id: s.program.id, codigo: s.program.codigo, nombre: s.program.nombre } : null,
      estado: s.estado,
      deletedAt: s.deletedAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    };
  }
}
