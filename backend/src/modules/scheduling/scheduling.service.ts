import { HttpError } from "../../utils/http-error.js";
import { ConflictDetectionService, type ConflictDetectionResult } from "./conflict-detection.service.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type ManualAssignmentInput = {
  classroomId: string;
  meetings: Array<{
    diaSemana: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
    timeBlockId: string;
  }>;
};

const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function buildTeacherAvailabilitySet(availabilities: any[]) {
  return new Set(availabilities.filter((item) => item.activo).map((item) => `${item.diaSemana}:${item.horaInicio}:${item.horaFin}`));
}

function buildClassroomAvailabilitySet(availabilities: any[]) {
  return new Set(availabilities.filter((item) => item.activo).map((item) => `${item.diaSemana}:${item.horaInicio}:${item.horaFin}`));
}

function toHorarioResumen(meetings: any[]) {
  return meetings
    .sort((a, b) => DAY_ORDER.indexOf(a.diaSemana) - DAY_ORDER.indexOf(b.diaSemana))
    .map((item) => `${item.diaSemana.slice(0, 3)} ${item.timeBlock.horaInicio}-${item.timeBlock.horaFin}`)
    .join(" | ");
}

export class SchedulingService {
  private readonly conflictService: ConflictDetectionService;

  constructor(private readonly prisma: any) {
    this.conflictService = new ConflictDetectionService(prisma);
  }

  async detectConflicts(): Promise<ConflictDetectionResult> {
    return this.conflictService.detectAll();
  }

  async getManualContext(sectionId: string) {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        teacher: {
          include: {
            availabilities: true,
            assignableCourses: true
          }
        },
        classroom: true,
        scheduleMeetings: {
          include: {
            timeBlock: {
              include: {
                grupo: true
              }
            },
            classroom: true
          }
        }
      }
    });

    if (!section) {
      throw new HttpError(404, "Seccion no encontrada", "SECTION_NOT_FOUND");
    }

    if (!section.teacherId || !section.teacher) {
      throw new HttpError(400, "La seccion debe tener un docente asignado antes de programar horario", "SECTION_WITHOUT_TEACHER");
    }

    const [timeBlocks, classrooms] = await Promise.all([
      this.prisma.timeBlock.findMany({
        where: { activo: true, grupo: { activo: true } },
        include: { grupo: true },
        orderBy: [{ grupo: { nombre: "asc" } }, { orden: "asc" }]
      }),
      this.prisma.classroom.findMany({
        where: {
          activo: true,
          capacidad: { gte: section.capacidad }
        },
        include: {
          availabilities: true,
          scheduleMeetings: {
            include: {
              timeBlock: true,
              section: {
                include: {
                  course: true
                }
              }
            }
          }
        },
        orderBy: [{ edificio: "asc" }, { codigo: "asc" }]
      })
    ]);

    const teacherAvailability = buildTeacherAvailabilitySet(section.teacher.availabilities);

    const slotOptions = timeBlocks.flatMap((block: any) =>
      DAY_ORDER.slice(0, 6).map((diaSemana) => {
        const availabilityKey = `${diaSemana}:${block.horaInicio}:${block.horaFin}`;
        const teacherAvailable = teacherAvailability.has(availabilityKey);
        const teacherConflict = teacherAvailable
          ? false
          : true;

        return {
          diaSemana,
          timeBlockId: block.id,
          label: `${diaSemana} ${block.horaInicio}-${block.horaFin}`,
          grupo: block.grupo.nombre,
          teacherAvailable,
          disabled: !teacherAvailable,
          reason: teacherConflict ? "Docente no disponible en este bloque" : null
        };
      })
    );

    const classroomOptions = classrooms.map((classroom: any) => {
      const availabilitySet = buildClassroomAvailabilitySet(classroom.availabilities);
      return {
        id: classroom.id,
        codigo: classroom.codigo,
        edificio: classroom.edificio,
        capacidad: classroom.capacidad,
        equipamiento: Array.isArray(classroom.equipamiento) ? classroom.equipamiento : [],
        availabilityKeys: Array.from(availabilitySet)
      };
    });

    return {
      section: {
        id: section.id,
        codigoSeccion: section.codigoSeccion,
        capacidad: section.capacidad,
        inscritos: section.inscritos,
        horarioResumen: section.horarioResumen,
        course: section.course,
        teacher: {
          id: section.teacher.id,
          nombre: section.teacher.nombre,
          apellido: section.teacher.apellido
        },
        assignedClassroomId: section.classroomId,
        assignedMeetings: section.scheduleMeetings.map((item: any) => ({
          id: item.id,
          diaSemana: item.diaSemana,
          timeBlockId: item.timeBlockId,
          classroomId: item.classroomId,
          label: `${item.diaSemana} ${item.timeBlock.horaInicio}-${item.timeBlock.horaFin}`
        }))
      },
      requiredSessions: section.course.sesionesPorSemana,
      slotOptions,
      classroomOptions
    };
  }

  async saveManualAssignment(sectionId: string, input: ManualAssignmentInput, meta: RequestMeta) {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        teacher: {
          include: {
            availabilities: true
          }
        }
      }
    });

    if (!section) {
      throw new HttpError(404, "Seccion no encontrada", "SECTION_NOT_FOUND");
    }

    if (!section.teacherId || !section.teacher) {
      throw new HttpError(400, "La seccion debe tener un docente asignado antes de programar horario", "SECTION_WITHOUT_TEACHER");
    }

    if (input.meetings.length !== section.course.sesionesPorSemana) {
      throw new HttpError(
        400,
        `La seccion requiere exactamente ${section.course.sesionesPorSemana} sesiones por semana`,
        "INVALID_MANUAL_ASSIGNMENT_COUNT"
      );
    }

    const duplicatedMeetings = new Set<string>();
    for (const meeting of input.meetings) {
      const key = `${meeting.diaSemana}:${meeting.timeBlockId}`;
      if (duplicatedMeetings.has(key)) {
        throw new HttpError(400, "No puedes repetir el mismo bloque dentro de la misma seccion", "DUPLICATE_SECTION_MEETING");
      }
      duplicatedMeetings.add(key);
    }

    const [classroom, timeBlocks, teacherConflicts, classroomConflicts] = await Promise.all([
      this.prisma.classroom.findUnique({
        where: { id: input.classroomId },
        include: {
          availabilities: true
        }
      }),
      this.prisma.timeBlock.findMany({
        where: {
          id: { in: input.meetings.map((item) => item.timeBlockId) }
        }
      }),
      this.prisma.sectionScheduleMeeting.findMany({
        where: {
          section: {
            teacherId: section.teacherId
          },
          NOT: { sectionId },
          OR: input.meetings.map((item) => ({
            diaSemana: item.diaSemana,
            timeBlockId: item.timeBlockId
          }))
        },
        include: {
          section: {
            include: {
              course: true
            }
          }
        }
      }),
      this.prisma.sectionScheduleMeeting.findMany({
        where: {
          classroomId: input.classroomId,
          NOT: { sectionId },
          OR: input.meetings.map((item) => ({
            diaSemana: item.diaSemana,
            timeBlockId: item.timeBlockId
          }))
        },
        include: {
          section: {
            include: {
              course: true
            }
          }
        }
      })
    ]);

    if (!classroom || !classroom.activo) {
      throw new HttpError(400, "El aula seleccionada no existe o esta inactiva", "INVALID_ASSIGNMENT_CLASSROOM");
    }

    if (classroom.capacidad < section.capacidad) {
      throw new HttpError(400, "La capacidad del aula no alcanza para esta seccion", "ASSIGNMENT_CLASSROOM_CAPACITY");
    }

    if (timeBlocks.length !== input.meetings.length) {
      throw new HttpError(400, "Uno o mas bloques horarios seleccionados no existen", "INVALID_ASSIGNMENT_BLOCK");
    }

    const blockById = new Map(timeBlocks.map((item: any) => [item.id, item]));
    const teacherAvailabilitySet = buildTeacherAvailabilitySet(section.teacher.availabilities);
    const classroomAvailabilitySet = buildClassroomAvailabilitySet(classroom.availabilities);

    for (const meeting of input.meetings) {
      const block: any = blockById.get(meeting.timeBlockId);
      if (!block) continue;
      const availabilityKey = `${meeting.diaSemana}:${block.horaInicio}:${block.horaFin}`;

      if (!teacherAvailabilitySet.has(availabilityKey)) {
        throw new HttpError(400, "El docente no esta disponible en uno de los bloques seleccionados", "TEACHER_UNAVAILABLE_FOR_ASSIGNMENT");
      }

      if (!classroomAvailabilitySet.has(availabilityKey)) {
        throw new HttpError(400, "El aula no esta disponible en uno de los bloques seleccionados", "CLASSROOM_UNAVAILABLE_FOR_ASSIGNMENT");
      }
    }

    if (teacherConflicts.length > 0) {
      throw new HttpError(409, "El docente ya tiene una clase asignada en uno de los bloques seleccionados", "TEACHER_ASSIGNMENT_CONFLICT");
    }

    if (classroomConflicts.length > 0) {
      throw new HttpError(409, "El aula ya esta ocupada en uno de los bloques seleccionados", "CLASSROOM_ASSIGNMENT_CONFLICT");
    }

    const createdMeetings = await this.prisma.$transaction(async (tx: any) => {
      await tx.sectionScheduleMeeting.deleteMany({ where: { sectionId } });

      for (const meeting of input.meetings) {
        await tx.sectionScheduleMeeting.create({
          data: {
            sectionId,
            diaSemana: meeting.diaSemana,
            timeBlockId: meeting.timeBlockId,
            classroomId: input.classroomId
          }
        });
      }

      const reloaded = await tx.sectionScheduleMeeting.findMany({
        where: { sectionId },
        include: {
          timeBlock: true,
          classroom: true
        }
      });

      await tx.courseSection.update({
        where: { id: sectionId },
        data: {
          classroomId: input.classroomId,
          horarioResumen: toHorarioResumen(reloaded)
        }
      });

      return reloaded;
    });

    await this.createAuditLog(meta.userId ?? null, "scheduling.manual_assignment.save", meta, {
      sectionId,
      classroomId: input.classroomId,
      totalMeetings: createdMeetings.length
    });

    return this.getManualContext(sectionId);
  }

  async getOverview(view: "all" | "teacher" | "classroom" | "course", entityId?: string) {
    const where: Record<string, unknown> = {};

    if (view === "teacher" && entityId) {
      where.section = { teacherId: entityId };
    }

    if (view === "classroom" && entityId) {
      where.classroomId = entityId;
    }

    if (view === "course" && entityId) {
      where.section = { courseId: entityId };
    }

    const items = await this.prisma.sectionScheduleMeeting.findMany({
      where,
      include: {
        timeBlock: {
          include: {
            grupo: true
          }
        },
        classroom: true,
        section: {
          include: {
            course: true,
            teacher: true
          }
        }
      },
      orderBy: [{ diaSemana: "asc" }, { timeBlock: { orden: "asc" } }]
    });

    const meetings = items.map((item: any) => ({
      id: item.id,
      diaSemana: item.diaSemana,
      timeBlockId: item.timeBlockId,
      horaInicio: item.timeBlock.horaInicio,
      horaFin: item.timeBlock.horaFin,
      grupo: item.timeBlock.grupo.nombre,
      sectionId: item.sectionId,
      courseId: item.section.courseId,
      courseCodigo: item.section.course.codigo,
      courseNombre: item.section.course.nombre,
      sectionCodigo: item.section.codigoSeccion,
      teacherId: item.section.teacherId,
      teacherNombre: item.section.teacher ? `${item.section.teacher.nombre} ${item.section.teacher.apellido}` : "Sin docente",
      classroomId: item.classroomId,
      classroomNombre: `${item.classroom.codigo} - ${item.classroom.edificio}`
    }));

    const counts = {
      totalMeetings: meetings.length,
      totalSectionsScheduled: new Set(meetings.map((item: any) => item.sectionId)).size,
      totalCoursesScheduled: new Set(meetings.map((item: any) => item.courseId)).size
    };

    return {
      view,
      entityId: entityId ?? null,
      counts,
      meetings
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
