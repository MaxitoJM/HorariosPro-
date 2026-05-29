import type { PrismaClient } from "@prisma/client";
import { audit } from "../../utils/audit.js";
import { HttpError } from "../../utils/http-error.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type CourseInput = {
  codigo: string;
  nombre: string;
  departamento: string;
  creditos: number;
  sesionesPorSemana: number;
  duracionMinutos: number;
  activo?: boolean;
};

type SectionInput = {
  codigoSeccion: string;
  teacherId?: string;
  classroomId?: string;
  capacidad: number;
  inscritos: number;
  horarioResumen?: string;
  activo?: boolean;
};

export class CoursesService {
  constructor(private readonly prisma: PrismaClient) {}

  async listCourses() {
    const items = await this.prisma.course.findMany({
      include: {
        sections: {
          where: { deletedAt: null },
          include: {
            teacher: true,
            classroom: true
          },
          orderBy: { codigoSeccion: "asc" }
        }
      },
      orderBy: [{ departamento: "asc" }, { codigo: "asc" }]
    });

    return items.map((course: any) => this.toCourseSummary(course));
  }

  async getCourseById(id: string) {
    const item = await this.prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          where: { deletedAt: null },
          include: {
            teacher: true,
            classroom: true
          },
          orderBy: { codigoSeccion: "asc" }
        }
      }
    });

    if (!item) {
      throw new HttpError(404, "Curso no encontrado", "COURSE_NOT_FOUND");
    }

    return this.toCourseSummary(item);
  }

  async createCourse(input: CourseInput, meta: RequestMeta) {
    await this.ensureUniqueCourseCode(input.codigo);

    const item = await this.prisma.course.create({
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        departamento: input.departamento,
        creditos: input.creditos,
        sesionesPorSemana: input.sesionesPorSemana,
        duracionMinutos: input.duracionMinutos,
        activo: input.activo ?? true
      },
      include: {
        sections: {
          where: { deletedAt: null },
          include: {
            teacher: true,
            classroom: true
          }
        }
      }
    });

    await this.createAuditLog(meta.userId ?? null, "courses.create", meta, { courseId: item.id });
    return this.toCourseSummary(item);
  }

  async updateCourse(id: string, input: CourseInput, meta: RequestMeta) {
    await this.requireCourse(id);
    await this.ensureUniqueCourseCode(input.codigo, id);

    const item = await this.prisma.course.update({
      where: { id },
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        departamento: input.departamento,
        creditos: input.creditos,
        sesionesPorSemana: input.sesionesPorSemana,
        duracionMinutos: input.duracionMinutos,
        activo: input.activo ?? true
      },
      include: {
        sections: {
          where: { deletedAt: null },
          include: {
            teacher: true,
            classroom: true
          },
          orderBy: { codigoSeccion: "asc" }
        }
      }
    });

    await this.createAuditLog(meta.userId ?? null, "courses.update", meta, { courseId: id });
    return this.toCourseSummary(item);
  }

  async deleteCourse(id: string, meta: RequestMeta) {
    const existing = await this.requireCourse(id);

    if (existing.deletedAt) {
      throw new HttpError(409, "El curso ya fue eliminado", "COURSE_ALREADY_DELETED");
    }

    // Bloqueo: curso con secciones activas (sin borrar). Incluye programadas o con inscritos.
    // Contamos inscripciones reales (estado=inscrito) en vez de confiar en el cache `inscritos`.
    const activeSections = await this.prisma.courseSection.findMany({
      where: { courseId: id },
      select: {
        id: true,
        _count: { select: { scheduleMeetings: true, enrollments: { where: { estado: "inscrito" } } } }
      }
    });

    if (activeSections.length > 0) {
      const programmed = activeSections.filter((s) => s._count.scheduleMeetings > 0).length;
      const enrolled = activeSections.filter((s) => s._count.enrollments > 0).length;
      if (programmed > 0 || enrolled > 0) {
        throw new HttpError(
          409,
          `El curso tiene ${activeSections.length} seccion(es) activa(s) (${programmed} programadas, ${enrolled} con inscritos). Reasigne o elimine las secciones primero.`,
          "COURSE_HAS_DEPENDENCIES"
        );
      }
      throw new HttpError(
        409,
        `El curso tiene ${activeSections.length} seccion(es) activa(s). Elimine las secciones primero.`,
        "COURSE_HAS_SECTIONS"
      );
    }

    const now = new Date();
    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: now, deletedBy: meta.userId ?? null }
    });

    await audit(this.prisma, meta, {
      action: "courses.softDelete",
      entityType: "course",
      entityId: id,
      before: { id, codigo: existing.codigo, nombre: existing.nombre, activo: existing.activo },
      after: { id, deletedAt: now.toISOString(), deletedBy: meta.userId ?? null }
    });
  }

  async restoreCourse(id: string, meta: RequestMeta) {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Curso no encontrado", "COURSE_NOT_FOUND");
    }
    if (!existing.deletedAt) {
      throw new HttpError(409, "El curso no esta eliminado", "COURSE_NOT_DELETED");
    }

    const conflict = await this.prisma.course.findFirst({
      where: { codigo: existing.codigo, id: { not: id } }
    });
    if (conflict) {
      throw new HttpError(
        409,
        "Otro curso activo ya usa este codigo. Cambielo antes de restaurar.",
        "CODIGO_CONFLICT_ON_RESTORE"
      );
    }

    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null }
    });

    await audit(this.prisma, meta, {
      action: "courses.restore",
      entityType: "course",
      entityId: id,
      before: { id, deletedAt: existing.deletedAt.toISOString(), deletedBy: existing.deletedBy ?? null },
      after: { id, deletedAt: null, deletedBy: null }
    });

    return this.getCourseById(id);
  }

  async createSection(courseId: string, input: SectionInput, meta: RequestMeta) {
    const course = await this.requireCourse(courseId);
    await this.validateSectionReferences(courseId, course.codigo, input);

    const item = await this.prisma.courseSection.create({
      data: {
        courseId,
        codigoSeccion: input.codigoSeccion,
        teacherId: input.teacherId || null,
        classroomId: input.classroomId || null,
        capacidad: input.capacidad,
        inscritos: input.inscritos,
        horarioResumen: input.horarioResumen || null,
        activo: input.activo ?? true
      },
      include: {
        teacher: true,
        classroom: true
      }
    });

    await this.createAuditLog(meta.userId ?? null, "courses.sections.create", meta, {
      courseId,
      sectionId: item.id
    });
    return this.toSectionSummary(item);
  }

  async updateSection(courseId: string, sectionId: string, input: SectionInput, meta: RequestMeta) {
    const course = await this.requireCourse(courseId);
    const existing = await this.prisma.courseSection.findFirst({
      where: {
        id: sectionId,
        courseId
      }
    });

    if (!existing) {
      throw new HttpError(404, "Seccion no encontrada", "SECTION_NOT_FOUND");
    }

    await this.validateSectionReferences(courseId, course.codigo, input, sectionId);

    const item = await this.prisma.courseSection.update({
      where: { id: sectionId },
      data: {
        codigoSeccion: input.codigoSeccion,
        teacherId: input.teacherId || null,
        classroomId: input.classroomId || null,
        capacidad: input.capacidad,
        inscritos: input.inscritos,
        horarioResumen: input.horarioResumen || null,
        activo: input.activo ?? existing.activo
      },
      include: {
        teacher: true,
        classroom: true
      }
    });

    await this.createAuditLog(meta.userId ?? null, "courses.sections.update", meta, {
      courseId,
      sectionId
    });
    return this.toSectionSummary(item);
  }

  async deleteSection(courseId: string, sectionId: string, meta: RequestMeta) {
    await this.requireCourse(courseId);

    const existing = await this.prisma.courseSection.findFirst({
      where: { id: sectionId, courseId },
      include: {
        _count: { select: { scheduleMeetings: true, enrollments: { where: { estado: "inscrito" } } } }
      }
    });

    if (!existing) {
      throw new HttpError(404, "Seccion no encontrada", "SECTION_NOT_FOUND");
    }

    if (existing.deletedAt) {
      throw new HttpError(409, "La seccion ya fue eliminada", "SECTION_ALREADY_DELETED");
    }

    if (existing._count.scheduleMeetings > 0) {
      throw new HttpError(
        409,
        `La seccion tiene ${existing._count.scheduleMeetings} reunion(es) programada(s). Use 'reasignar' o limpie el horario antes de eliminar.`,
        "SECTION_HAS_SCHEDULE"
      );
    }

    if (existing._count.enrollments > 0) {
      throw new HttpError(
        409,
        `La seccion tiene ${existing._count.enrollments} estudiante(s) inscrito(s). No puede eliminarse.`,
        "SECTION_HAS_ENROLLMENTS"
      );
    }

    const now = new Date();
    await this.prisma.courseSection.update({
      where: { id: sectionId },
      data: { deletedAt: now, deletedBy: meta.userId ?? null }
    });

    await audit(this.prisma, meta, {
      action: "courses.sections.softDelete",
      entityType: "courseSection",
      entityId: sectionId,
      before: { id: sectionId, codigoSeccion: existing.codigoSeccion, courseId, activo: existing.activo },
      after: { id: sectionId, deletedAt: now.toISOString(), deletedBy: meta.userId ?? null }
    });
  }

  async restoreSection(courseId: string, sectionId: string, meta: RequestMeta) {
    const course = await this.requireCourse(courseId);
    // No se puede restaurar una seccion bajo un curso borrado: quedaria activa
    // colgando de un padre invisible. Restaurar el curso primero.
    if (course.deletedAt) {
      throw new HttpError(
        409,
        "El curso esta eliminado. Restaure el curso antes de restaurar la seccion.",
        "PARENT_COURSE_DELETED"
      );
    }
    // findUnique no es interceptado por la soft-delete extension → ve registros borrados.
    const existing = await this.prisma.courseSection.findUnique({ where: { id: sectionId } });
    if (!existing || existing.courseId !== courseId) {
      throw new HttpError(404, "Seccion no encontrada", "SECTION_NOT_FOUND");
    }
    if (!existing.deletedAt) {
      throw new HttpError(409, "La seccion no esta eliminada", "SECTION_NOT_DELETED");
    }

    // codigoSeccion debe ser único dentro del courseId entre secciones no borradas
    const conflict = await this.prisma.courseSection.findFirst({
      where: { courseId, codigoSeccion: existing.codigoSeccion, id: { not: sectionId } }
    });
    if (conflict) {
      throw new HttpError(
        409,
        "Otra seccion activa del curso ya usa este codigo.",
        "SECTION_CODIGO_CONFLICT_ON_RESTORE"
      );
    }

    await this.prisma.courseSection.update({
      where: { id: sectionId },
      data: { deletedAt: null, deletedBy: null }
    });

    await audit(this.prisma, meta, {
      action: "courses.sections.restore",
      entityType: "courseSection",
      entityId: sectionId,
      before: { id: sectionId, deletedAt: existing.deletedAt.toISOString(), deletedBy: existing.deletedBy ?? null },
      after: { id: sectionId, deletedAt: null, deletedBy: null }
    });

    const restored = await this.prisma.courseSection.findFirst({
      where: { id: sectionId },
      include: { teacher: true, classroom: true }
    });
    return restored ? this.toSectionSummary(restored) : null;
  }

  private async requireCourse(id: string) {
    const item = await this.prisma.course.findUnique({ where: { id } });
    if (!item) {
      throw new HttpError(404, "Curso no encontrado", "COURSE_NOT_FOUND");
    }

    return item;
  }

  private async ensureUniqueCourseCode(codigo: string, excludeId?: string) {
    // findUnique ve soft-deleted (constraint global). Ver nota en teachers.service.
    const existing = await this.prisma.course.findUnique({ where: { codigo } });
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "Ya existe un curso con ese codigo", "COURSE_CODE_TAKEN");
    }
  }

  private async validateSectionReferences(courseId: string, courseCode: string, input: SectionInput, excludeSectionId?: string) {
    if (input.inscritos > input.capacidad) {
      throw new HttpError(400, "Los inscritos no pueden superar la capacidad de la seccion", "SECTION_ENROLLMENT_EXCEEDS_CAPACITY");
    }

    // findUnique sobre el constraint compuesto ve soft-deleted (constraint global).
    const duplicatedCode = await this.prisma.courseSection.findUnique({
      where: { courseId_codigoSeccion: { courseId, codigoSeccion: input.codigoSeccion } }
    });

    if (duplicatedCode && duplicatedCode.id !== excludeSectionId) {
      throw new HttpError(409, "Ya existe una seccion con ese codigo para el curso", "SECTION_CODE_TAKEN");
    }

    if (input.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: input.teacherId },
        include: {
          assignableCourses: true
        }
      });

      if (!teacher || !teacher.activo) {
        throw new HttpError(400, "El docente seleccionado no existe o esta inactivo", "INVALID_SECTION_TEACHER");
      }

      const canTeachCourse = teacher.assignableCourses.some(
        (item: any) => item.activo && item.codigoCurso === courseCode
      );

      if (!canTeachCourse) {
        throw new HttpError(
          400,
          "El docente seleccionado no tiene habilitado este curso dentro de sus cursos asignables",
          "TEACHER_NOT_ASSIGNABLE_FOR_COURSE"
        );
      }
    }

    if (input.classroomId) {
      const classroom = await this.prisma.classroom.findUnique({
        where: { id: input.classroomId }
      });

      if (!classroom || !classroom.activo) {
        throw new HttpError(400, "El aula seleccionada no existe o esta inactiva", "INVALID_SECTION_CLASSROOM");
      }

      if (classroom.capacidad < input.capacidad) {
        throw new HttpError(
          400,
          "La capacidad del aula no soporta la capacidad configurada para la seccion",
          "CLASSROOM_CAPACITY_TOO_LOW"
        );
      }
    }
  }

  private toCourseSummary(course: {
    id: string;
    codigo: string;
    nombre: string;
    departamento: string;
    creditos: number;
    sesionesPorSemana: number;
    duracionMinutos: number;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    sections: Array<{
      id: string;
      codigoSeccion: string;
      teacherId: string | null;
      classroomId: string | null;
      capacidad: number;
      inscritos: number;
      horarioResumen: string | null;
      activo: boolean;
      teacher?: { id: string; nombre: string; apellido: string } | null;
      classroom?: { id: string; codigo: string; edificio: string } | null;
    }>;
  }) {
    const sections = course.sections.map((section) => this.toSectionSummary(section));

    return {
      ...course,
      sections,
      totalSecciones: sections.length,
      totalInscritos: sections.reduce((acc, section) => acc + section.inscritos, 0)
    };
  }

  private toSectionSummary(section: {
    id: string;
    codigoSeccion: string;
    teacherId?: string | null;
    classroomId?: string | null;
    capacidad: number;
    inscritos: number;
    horarioResumen: string | null;
    activo: boolean;
    teacher?: { id: string; nombre: string; apellido: string } | null;
    classroom?: { id: string; codigo: string; edificio: string } | null;
  }) {
    return {
      ...section,
      teacherNombre: section.teacher ? `${section.teacher.nombre} ${section.teacher.apellido}` : null,
      classroomNombre: section.classroom ? `${section.classroom.codigo} - ${section.classroom.edificio}` : null
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
