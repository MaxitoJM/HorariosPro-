import type { PrismaClient } from "@prisma/client";
import { HttpError } from "../../utils/http-error.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type TeacherInput = {
  nombre: string;
  apellido: string;
  email: string;
  departamento: string;
  titulo?: string;
  maxHorasSemana: number;
  activo?: boolean;
};

type AvailabilityInput = {
  diaSemana: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
  horaInicio: string;
  horaFin: string;
  activo?: boolean;
};

type AssignableCourseInput = {
  codigoCurso?: string;
  nombreCurso: string;
  activo?: boolean;
};

function parseTimeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export class TeachersService {
  constructor(private readonly prisma: PrismaClient) {}

  async listTeachers() {
    const teachers = await this.prisma.teacher.findMany({
      include: {
        availabilities: {
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }]
        },
        assignableCourses: {
          orderBy: { nombreCurso: "asc" }
        }
      },
      orderBy: [{ departamento: "asc" }, { apellido: "asc" }]
    });

    return teachers.map((teacher) => this.toTeacherSummary(teacher));
  }

  async getTeacherById(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        availabilities: {
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }]
        },
        assignableCourses: {
          orderBy: { nombreCurso: "asc" }
        }
      }
    });

    if (!teacher) {
      throw new HttpError(404, "Docente no encontrado", "TEACHER_NOT_FOUND");
    }

    return this.toTeacherSummary(teacher);
  }

  async createTeacher(input: TeacherInput, meta: RequestMeta) {
    await this.ensureUniqueTeacherEmail(input.email);

    const teacher = await this.prisma.teacher.create({
      data: {
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        departamento: input.departamento,
        titulo: input.titulo || null,
        maxHorasSemana: input.maxHorasSemana,
        activo: input.activo ?? true
      },
      include: {
        availabilities: true,
        assignableCourses: true
      }
    });

    await this.createAuditLog(meta.userId ?? null, "teachers.create", meta, { teacherId: teacher.id });
    return this.toTeacherSummary(teacher);
  }

  async updateTeacher(id: string, input: TeacherInput, meta: RequestMeta) {
    const existing = await this.prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Docente no encontrado", "TEACHER_NOT_FOUND");
    }

    await this.ensureUniqueTeacherEmail(input.email, id);

    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: {
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        departamento: input.departamento,
        titulo: input.titulo || null,
        maxHorasSemana: input.maxHorasSemana,
        activo: input.activo ?? existing.activo
      },
      include: {
        availabilities: true,
        assignableCourses: true
      }
    });

    await this.createAuditLog(meta.userId ?? null, "teachers.update", meta, { teacherId: id });
    return this.toTeacherSummary(teacher);
  }

  async deleteTeacher(id: string, meta: RequestMeta) {
    const existing = await this.prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Docente no encontrado", "TEACHER_NOT_FOUND");
    }

    await this.prisma.teacher.delete({ where: { id } });
    await this.createAuditLog(meta.userId ?? null, "teachers.delete", meta, { teacherId: id });
  }

  async updateTeacherAvailability(id: string, availability: AvailabilityInput[], meta: RequestMeta) {
    await this.requireTeacher(id);
    this.validateAvailability(availability);

    await this.prisma.$transaction(async (tx) => {
      await tx.teacherAvailability.deleteMany({ where: { teacherId: id } });

      if (availability.length > 0) {
        await tx.teacherAvailability.createMany({
          data: availability.map((item) => ({
            teacherId: id,
            diaSemana: item.diaSemana,
            horaInicio: item.horaInicio,
            horaFin: item.horaFin,
            activo: item.activo ?? true
          }))
        });
      }
    });

    await this.createAuditLog(meta.userId ?? null, "teachers.availability.update", meta, { teacherId: id });
    return this.getTeacherById(id);
  }

  async updateTeacherAssignableCourses(id: string, courses: AssignableCourseInput[], meta: RequestMeta) {
    await this.requireTeacher(id);
    this.validateAssignableCourses(courses);

    await this.prisma.$transaction(async (tx) => {
      await tx.teacherAssignableCourse.deleteMany({ where: { teacherId: id } });

      if (courses.length > 0) {
        await tx.teacherAssignableCourse.createMany({
          data: courses.map((course) => ({
            teacherId: id,
            codigoCurso: course.codigoCurso || null,
            nombreCurso: course.nombreCurso,
            activo: course.activo ?? true
          }))
        });
      }
    });

    await this.createAuditLog(meta.userId ?? null, "teachers.assignable_courses.update", meta, { teacherId: id });
    return this.getTeacherById(id);
  }

  private async requireTeacher(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new HttpError(404, "Docente no encontrado", "TEACHER_NOT_FOUND");
    }

    return teacher;
  }

  private async ensureUniqueTeacherEmail(email: string, excludeId?: string) {
    const existing = await this.prisma.teacher.findFirst({
      where: {
        email,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });

    if (existing) {
      throw new HttpError(409, "Ya existe un docente con ese email", "TEACHER_EMAIL_TAKEN");
    }
  }

  private validateAvailability(availability: AvailabilityInput[]) {
    for (const item of availability) {
      if (parseTimeToMinutes(item.horaFin) <= parseTimeToMinutes(item.horaInicio)) {
        throw new HttpError(400, "La disponibilidad debe tener una hora fin posterior a la hora inicio", "INVALID_AVAILABILITY_RANGE");
      }
    }

    const grouped = new Map<string, AvailabilityInput[]>();
    for (const item of availability) {
      const items = grouped.get(item.diaSemana) ?? [];
      items.push(item);
      grouped.set(item.diaSemana, items);
    }

    for (const items of grouped.values()) {
      const sorted = [...items].sort((a, b) => parseTimeToMinutes(a.horaInicio) - parseTimeToMinutes(b.horaInicio));
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1]!;
        const current = sorted[index]!;
        if (parseTimeToMinutes(current.horaInicio) < parseTimeToMinutes(previous.horaFin)) {
          throw new HttpError(400, "La disponibilidad del docente no puede tener rangos solapados en el mismo dia", "AVAILABILITY_OVERLAP");
        }
      }
    }
  }

  private validateAssignableCourses(courses: AssignableCourseInput[]) {
    const seen = new Set<string>();
    for (const course of courses) {
      const key = `${course.codigoCurso || ""}::${course.nombreCurso.toLowerCase()}`;
      if (seen.has(key)) {
        throw new HttpError(400, "No se pueden repetir cursos asignables para el mismo docente", "DUPLICATE_ASSIGNABLE_COURSE");
      }
      seen.add(key);
    }
  }

  private toTeacherSummary(teacher: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    departamento: string;
    titulo: string | null;
    maxHorasSemana: number;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    availabilities: Array<{
      id: string;
      diaSemana: string;
      horaInicio: string;
      horaFin: string;
      activo: boolean;
    }>;
    assignableCourses: Array<{
      id: string;
      codigoCurso: string | null;
      nombreCurso: string;
      activo: boolean;
    }>;
  }) {
    return {
      ...teacher,
      disponibilidadConfigurada: teacher.availabilities.length > 0,
      totalCursosAsignables: teacher.assignableCourses.length
    };
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
