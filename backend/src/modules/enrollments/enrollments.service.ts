import type { Prisma, PrismaClient } from "@prisma/client";
import { audit } from "../../utils/audit.js";
import { HttpError } from "../../utils/http-error.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type EnrollInput = {
  studentId: string;
  sectionId: string;
  periodoId?: string;
};

type EnrollmentStatus = "inscrito" | "retirado" | "aprobado" | "reprobado";

export class EnrollmentsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listEnrollments(filters: {
    sectionId?: string;
    studentId?: string;
    periodoId?: string;
    estado?: EnrollmentStatus;
  } = {}) {
    const where: Prisma.EnrollmentWhereInput = {
      ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.periodoId ? { periodoId: filters.periodoId } : {}),
      ...(filters.estado ? { estado: filters.estado } : {})
    };
    const items = await this.prisma.enrollment.findMany({
      where,
      include: {
        student: true,
        periodo: true,
        section: { include: { course: true } }
      },
      orderBy: [{ createdAt: "desc" }]
    });
    return items.map((e) => this.toSummary(e));
  }

  async enroll(input: EnrollInput, meta: RequestMeta) {
    // Resolver periodo: explicito o el actual.
    const periodo = input.periodoId
      ? await this.prisma.academicPeriod.findFirst({ where: { id: input.periodoId } })
      : await this.prisma.academicPeriod.findFirst({ where: { esActual: true } });
    if (!periodo) {
      throw new HttpError(400, "No hay periodo academico valido (especifique uno o marque el actual)", "NO_ACTIVE_PERIOD");
    }

    const student = await this.prisma.student.findFirst({ where: { id: input.studentId } });
    if (!student) {
      throw new HttpError(404, "Estudiante no encontrado", "STUDENT_NOT_FOUND");
    }
    if (student.estado !== "activo") {
      throw new HttpError(409, "El estudiante no esta en estado activo", "STUDENT_NOT_ACTIVE");
    }

    const section = await this.prisma.courseSection.findFirst({
      where: { id: input.sectionId },
      include: { course: true }
    });
    if (!section) {
      throw new HttpError(404, "Seccion no encontrada", "SECTION_NOT_FOUND");
    }
    if (!section.activo) {
      throw new HttpError(409, "La seccion no esta activa", "SECTION_NOT_ACTIVE");
    }

    // Duplicado: el unique es (studentId, sectionId, periodoId). findFirst (filtrado)
    // detecta inscripciones activas; si existe una soft-deleted, la reactivamos.
    const existingActive = await this.prisma.enrollment.findFirst({
      where: { studentId: input.studentId, sectionId: input.sectionId, periodoId: periodo.id }
    });
    if (existingActive) {
      throw new HttpError(409, "El estudiante ya esta inscrito en esta seccion para el periodo", "ALREADY_ENROLLED");
    }

    const enrollment = await this.prisma.$transaction(async (tx) => {
      // Capacidad: contar inscritos activos.
      const activeCount = await tx.enrollment.count({
        where: { sectionId: input.sectionId, estado: "inscrito", deletedAt: null }
      });
      if (activeCount >= section.capacidad) {
        throw new HttpError(409, `La seccion alcanzo su capacidad (${section.capacidad}).`, "SECTION_FULL");
      }

      // Reusar registro soft-deleted si existe (respeta el unique constraint global).
      const softDeleted = await tx.enrollment.findUnique({
        where: {
          studentId_sectionId_periodoId: {
            studentId: input.studentId,
            sectionId: input.sectionId,
            periodoId: periodo.id
          }
        }
      });

      const created = softDeleted
        ? await tx.enrollment.update({
            where: { id: softDeleted.id },
            data: { estado: "inscrito", deletedAt: null, deletedBy: null }
          })
        : await tx.enrollment.create({
            data: {
              studentId: input.studentId,
              sectionId: input.sectionId,
              periodoId: periodo.id,
              estado: "inscrito"
            }
          });

      await this.recomputeInscritos(tx, input.sectionId);
      return created;
    });

    await audit(this.prisma, meta, {
      action: "enrollments.enroll",
      entityType: "enrollment",
      entityId: enrollment.id,
      after: { id: enrollment.id, studentId: input.studentId, sectionId: input.sectionId, periodoId: periodo.id }
    });

    return this.getEnrollmentById(enrollment.id);
  }

  async withdraw(id: string, meta: RequestMeta) {
    const existing = await this.prisma.enrollment.findFirst({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Inscripcion no encontrada", "ENROLLMENT_NOT_FOUND");
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id },
        data: { estado: "retirado", deletedAt: now, deletedBy: meta.userId ?? null }
      });
      await this.recomputeInscritos(tx, existing.sectionId);
    });

    await audit(this.prisma, meta, {
      action: "enrollments.withdraw",
      entityType: "enrollment",
      entityId: id,
      before: { id, estado: existing.estado },
      after: { id, estado: "retirado", deletedAt: now.toISOString() }
    });
  }

  async setStatus(id: string, estado: EnrollmentStatus, meta: RequestMeta) {
    const existing = await this.prisma.enrollment.findFirst({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Inscripcion no encontrada", "ENROLLMENT_NOT_FOUND");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({ where: { id }, data: { estado } });
      // Si pasa de/ hacia 'inscrito', el conteo de inscritos cambia.
      await this.recomputeInscritos(tx, existing.sectionId);
    });

    await audit(this.prisma, meta, {
      action: "enrollments.setStatus",
      entityType: "enrollment",
      entityId: id,
      before: { id, estado: existing.estado },
      after: { id, estado }
    });
    return this.getEnrollmentById(id);
  }

  async getEnrollmentById(id: string) {
    const item = await this.prisma.enrollment.findFirst({
      where: { id },
      include: {
        student: true,
        periodo: true,
        section: { include: { course: true } }
      }
    });
    if (!item) {
      throw new HttpError(404, "Inscripcion no encontrada", "ENROLLMENT_NOT_FOUND");
    }
    return this.toSummary(item);
  }

  // Recalcula el contador cacheado CourseSection.inscritos = inscripciones activas.
  private async recomputeInscritos(tx: Prisma.TransactionClient, sectionId: string) {
    const count = await tx.enrollment.count({
      where: { sectionId, estado: "inscrito", deletedAt: null }
    });
    await tx.courseSection.update({ where: { id: sectionId }, data: { inscritos: count } });
  }

  private toSummary(e: any) {
    return {
      id: e.id,
      estado: e.estado,
      studentId: e.studentId,
      sectionId: e.sectionId,
      periodoId: e.periodoId,
      deletedAt: e.deletedAt ?? null,
      student: e.student
        ? { id: e.student.id, codigo: e.student.codigo, nombre: e.student.nombre, apellido: e.student.apellido }
        : null,
      periodo: e.periodo ? { id: e.periodo.id, codigo: e.periodo.codigo } : null,
      section: e.section
        ? {
            id: e.section.id,
            codigoSeccion: e.section.codigoSeccion,
            course: e.section.course
              ? { id: e.section.course.id, codigo: e.section.course.codigo, nombre: e.section.course.nombre }
              : null
          }
        : null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    };
  }
}
