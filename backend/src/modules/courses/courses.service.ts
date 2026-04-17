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
  constructor(private readonly prisma: any) {}

  async listCourses() {
    const items = await this.prisma.course.findMany({
      include: {
        sections: {
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
    await this.requireCourse(id);
    await this.prisma.course.delete({ where: { id } });
    await this.createAuditLog(meta.userId ?? null, "courses.delete", meta, { courseId: id });
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
      where: {
        id: sectionId,
        courseId
      }
    });

    if (!existing) {
      throw new HttpError(404, "Seccion no encontrada", "SECTION_NOT_FOUND");
    }

    await this.prisma.courseSection.delete({ where: { id: sectionId } });
    await this.createAuditLog(meta.userId ?? null, "courses.sections.delete", meta, {
      courseId,
      sectionId
    });
  }

  private async requireCourse(id: string) {
    const item = await this.prisma.course.findUnique({ where: { id } });
    if (!item) {
      throw new HttpError(404, "Curso no encontrado", "COURSE_NOT_FOUND");
    }

    return item;
  }

  private async ensureUniqueCourseCode(codigo: string, excludeId?: string) {
    const existing = await this.prisma.course.findFirst({
      where: {
        codigo,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });

    if (existing) {
      throw new HttpError(409, "Ya existe un curso con ese codigo", "COURSE_CODE_TAKEN");
    }
  }

  private async validateSectionReferences(courseId: string, courseCode: string, input: SectionInput, excludeSectionId?: string) {
    if (input.inscritos > input.capacidad) {
      throw new HttpError(400, "Los inscritos no pueden superar la capacidad de la seccion", "SECTION_ENROLLMENT_EXCEEDS_CAPACITY");
    }

    const duplicatedCode = await this.prisma.courseSection.findFirst({
      where: {
        courseId,
        codigoSeccion: input.codigoSeccion,
        ...(excludeSectionId ? { id: { not: excludeSectionId } } : {})
      }
    });

    if (duplicatedCode) {
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
