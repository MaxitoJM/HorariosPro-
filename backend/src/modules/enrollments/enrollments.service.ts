import { HttpError } from "../../utils/http-error.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function parseTimeToMinutes(value: string): number {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function meetingKey(meeting: { diaSemana: string; timeBlockId: string }) {
  return `${meeting.diaSemana}::${meeting.timeBlockId}`;
}

function formatMeetings(meetings: any[]) {
  return [...meetings]
    .sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.diaSemana) - DAY_ORDER.indexOf(b.diaSemana);
      if (dayDiff !== 0) return dayDiff;
      return parseTimeToMinutes(a.timeBlock.horaInicio) - parseTimeToMinutes(b.timeBlock.horaInicio);
    })
    .map((meeting) => ({
      id: meeting.id,
      diaSemana: meeting.diaSemana,
      timeBlockId: meeting.timeBlockId,
      horaInicio: meeting.timeBlock.horaInicio,
      horaFin: meeting.timeBlock.horaFin,
      classroomId: meeting.classroomId,
      classroomNombre: `${meeting.classroom.codigo} - ${meeting.classroom.edificio}`
    }));
}

export class EnrollmentsService {
  constructor(private readonly prisma: any) {}

  async getEnrollmentContext(studentId: string) {
    await this.requireStudent(studentId);

    const [sections, enrollments] = await Promise.all([
      this.prisma.courseSection.findMany({
        where: {
          activo: true,
          course: { activo: true }
        },
        include: {
          course: true,
          teacher: true,
          classroom: true,
          enrollments: {
            where: { status: "activa" }
          },
          scheduleMeetings: {
            include: {
              timeBlock: true,
              classroom: true
            }
          }
        },
        orderBy: [{ course: { codigo: "asc" } }, { codigoSeccion: "asc" }]
      }),
      this.prisma.studentEnrollment.findMany({
        where: {
          studentId,
          status: "activa"
        },
        include: {
          section: {
            include: {
              course: true,
              teacher: true,
              classroom: true,
              scheduleMeetings: {
                include: {
                  timeBlock: true,
                  classroom: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const enrolledSectionIds = new Set(enrollments.map((item: any) => item.sectionId));
    const busyKeys = new Set(
      enrollments.flatMap((item: any) => item.section.scheduleMeetings.map((meeting: any) => meetingKey(meeting)))
    );

    const availableSections = sections.map((section: any) => {
      const isEnrolled = enrolledSectionIds.has(section.id);
      const sectionKeys = section.scheduleMeetings.map((meeting: any) => meetingKey(meeting));
      const hasScheduleConflict = !isEnrolled && sectionKeys.some((key: string) => busyKeys.has(key));
      const withoutSchedule = section.scheduleMeetings.length === 0;
      const full = section.inscritos >= section.capacidad;

      return {
        ...this.toSectionOption(section),
        isEnrolled,
        canEnroll: !isEnrolled && !hasScheduleConflict && !withoutSchedule && !full,
        disabledReason: isEnrolled
          ? "Ya estas inscrito en este grupo"
          : withoutSchedule
            ? "El grupo no tiene horario programado"
            : full
              ? "El grupo no tiene cupos disponibles"
              : hasScheduleConflict
                ? "Se cruza con otro grupo inscrito"
                : null
      };
    });

    return {
      enrolled: enrollments.map((enrollment: any) => this.toEnrollmentSummary(enrollment)),
      availableSections
    };
  }

  async enroll(studentId: string, sectionId: string, meta: RequestMeta) {
    await this.requireStudent(studentId);

    const section = await this.prisma.courseSection.findFirst({
      where: {
        id: sectionId,
        activo: true,
        course: { activo: true }
      },
      include: {
        course: true,
        teacher: true,
        classroom: true,
        enrollments: {
          where: { status: "activa" }
        },
        scheduleMeetings: {
          include: {
            timeBlock: true,
            classroom: true
          }
        }
      }
    });

    if (!section) {
      throw new HttpError(404, "Grupo no encontrado", "SECTION_NOT_FOUND");
    }

    if (section.scheduleMeetings.length === 0) {
      throw new HttpError(400, "No puedes inscribirte a un grupo sin horario programado", "SECTION_WITHOUT_SCHEDULE");
    }

    if (section.inscritos >= section.capacidad) {
      throw new HttpError(409, "El grupo no tiene cupos disponibles", "SECTION_FULL");
    }

    const currentEnrollments = await this.prisma.studentEnrollment.findMany({
      where: { studentId, status: "activa" },
      include: {
        section: {
          include: {
            course: true,
            scheduleMeetings: true
          }
        }
      }
    });

    if (currentEnrollments.some((item: any) => item.sectionId === sectionId)) {
      throw new HttpError(409, "Ya estas inscrito en este grupo", "ALREADY_ENROLLED");
    }

    const targetKeys = new Set(section.scheduleMeetings.map((meeting: any) => meetingKey(meeting)));
    const conflictingEnrollment = currentEnrollments.find((enrollment: any) =>
      enrollment.section.scheduleMeetings.some((meeting: any) => targetKeys.has(meetingKey(meeting)))
    );

    if (conflictingEnrollment) {
      throw new HttpError(
        409,
        `El grupo se cruza con ${conflictingEnrollment.section.course.codigo}/${conflictingEnrollment.section.codigoSeccion}`,
        "ENROLLMENT_SCHEDULE_CONFLICT"
      );
    }

    const enrollment = await this.prisma.$transaction(async (tx: any) => {
      const previous = await tx.studentEnrollment.findUnique({
        where: {
          studentId_sectionId: { studentId, sectionId }
        }
      });

      const saved = previous
        ? await tx.studentEnrollment.update({
            where: { id: previous.id },
            data: { status: "activa" }
          })
        : await tx.studentEnrollment.create({
            data: { studentId, sectionId, status: "activa" }
          });

      await tx.courseSection.update({
        where: { id: sectionId },
        data: { inscritos: section.inscritos + 1 }
      });

      return saved;
    });

    await this.createAuditLog(studentId, "enrollments.create", meta, { enrollmentId: enrollment.id, sectionId });
    return this.getEnrollmentContext(studentId);
  }

  async withdraw(studentId: string, enrollmentId: string, meta: RequestMeta) {
    await this.requireStudent(studentId);

    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: { id: enrollmentId, studentId, status: "activa" },
      include: { section: true }
    });

    if (!enrollment) {
      throw new HttpError(404, "Inscripcion no encontrada", "ENROLLMENT_NOT_FOUND");
    }

    await this.prisma.$transaction([
      this.prisma.studentEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "retirada" }
      }),
      this.prisma.courseSection.update({
        where: { id: enrollment.sectionId },
        data: { inscritos: Math.max(enrollment.section.inscritos - 1, 0) }
      })
    ]);

    await this.createAuditLog(studentId, "enrollments.withdraw", meta, { enrollmentId, sectionId: enrollment.sectionId });
    return this.getEnrollmentContext(studentId);
  }

  private async requireStudent(studentId: string) {
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        rol: "estudiante",
        activo: true
      }
    });

    if (!student) {
      throw new HttpError(403, "Solo estudiantes activos pueden gestionar inscripciones", "STUDENT_REQUIRED");
    }

    return student;
  }

  private toSectionOption(section: any) {
    return {
      id: section.id,
      codigoSeccion: section.codigoSeccion,
      courseId: section.courseId,
      courseCodigo: section.course.codigo,
      courseNombre: section.course.nombre,
      departamento: section.course.departamento,
      teacherNombre: section.teacher ? `${section.teacher.nombre} ${section.teacher.apellido}` : "Sin docente",
      classroomNombre: section.classroom ? `${section.classroom.codigo} - ${section.classroom.edificio}` : "Sin aula",
      capacidad: section.capacidad,
      inscritos: section.inscritos,
      cuposDisponibles: Math.max(section.capacidad - section.inscritos, 0),
      horarioResumen: section.horarioResumen,
      meetings: formatMeetings(section.scheduleMeetings)
    };
  }

  private toEnrollmentSummary(enrollment: any) {
    const { id: _sectionId, ...sectionOption } = this.toSectionOption(enrollment.section);
    return {
      id: enrollment.id,
      sectionId: enrollment.sectionId,
      status: enrollment.status,
      createdAt: enrollment.createdAt,
      ...sectionOption
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
