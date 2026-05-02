export type ConflictSeverity = "critical" | "warning" | "info";

export type ConflictType =
  | "TEACHER_DOUBLE_BOOKING"
  | "CLASSROOM_DOUBLE_BOOKING"
  | "SECTION_WITHOUT_TEACHER"
  | "SECTION_UNSCHEDULED"
  | "INVALID_SESSION_COUNT"
  | "TEACHER_UNAVAILABLE"
  | "CLASSROOM_UNAVAILABLE"
  | "CONSECUTIVE_DAYS";

export type DetectedConflict = {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  sectionId?: string;
  sectionCodigo?: string;
  courseCodigo?: string;
  courseNombre?: string;
  teacherId?: string;
  teacherNombre?: string;
  classroomId?: string;
  classroomCodigo?: string;
  diaSemana?: string;
  timeBlockLabel?: string;
  suggestions: string[];
};

export type ConflictSummary = {
  total: number;
  critical: number;
  warning: number;
  info: number;
};

export type ConflictDetectionResult = {
  conflicts: DetectedConflict[];
  summary: ConflictSummary;
  scannedAt: string;
};

const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function parseTimeToMinutes(value: string): number {
  const [h = 0, m = 0] = value.split(":").map(Number);
  return h * 60 + m;
}

function isBlockCoveredByAvailability(
  availabilities: Array<{ activo: boolean; diaSemana: string; horaInicio: string; horaFin: string }>,
  diaSemana: string,
  blockStart: string,
  blockEnd: string
): boolean {
  const blockStartMin = parseTimeToMinutes(blockStart);
  const blockEndMin = parseTimeToMinutes(blockEnd);
  return availabilities.some(
    (av) =>
      av.activo &&
      av.diaSemana === diaSemana &&
      parseTimeToMinutes(av.horaInicio) <= blockStartMin &&
      parseTimeToMinutes(av.horaFin) >= blockEndMin
  );
}

let idSeq = 0;
function makeId(): string {
  return `conflict-${Date.now()}-${++idSeq}`;
}

export class ConflictDetectionService {
  constructor(private readonly prisma: any) {}

  async detectAll(): Promise<ConflictDetectionResult> {
    idSeq = 0;

    const [sections, rules] = await Promise.all([
      this.prisma.courseSection.findMany({
        where: { activo: true },
        include: {
          course: true,
          teacher: {
            include: { availabilities: { where: { activo: true } } }
          },
          classroom: {
            include: { availabilities: { where: { activo: true } } }
          },
          scheduleMeetings: {
            include: { timeBlock: true, classroom: true }
          }
        }
      }),
      this.prisma.schedulingRule.findMany({ where: { activo: true } })
    ]);

    const avoidConsecutive =
      rules.find((r: any) => r.clave === "EVITAR_DIAS_CONSECUTIVOS")?.valor === "true";

    const conflicts: DetectedConflict[] = [];

    // Build indexes for double-booking detection
    const teacherSlotIndex = new Map<string, Array<{ meeting: any; section: any }>>();
    const classroomSlotIndex = new Map<string, Array<{ meeting: any; section: any }>>();

    for (const section of sections) {
      if (!section.teacherId) continue;
      for (const meeting of section.scheduleMeetings) {
        const tKey = `${section.teacherId}::${meeting.diaSemana}::${meeting.timeBlockId}`;
        const tList = teacherSlotIndex.get(tKey) ?? [];
        tList.push({ meeting, section });
        teacherSlotIndex.set(tKey, tList);

        const cKey = `${meeting.classroomId}::${meeting.diaSemana}::${meeting.timeBlockId}`;
        const cList = classroomSlotIndex.get(cKey) ?? [];
        cList.push({ meeting, section });
        classroomSlotIndex.set(cKey, cList);
      }
    }

    // TEACHER_DOUBLE_BOOKING
    for (const [, entries] of teacherSlotIndex) {
      if (entries.length < 2) continue;
      const { meeting, section } = entries[0]!;
      const teacher = section.teacher;
      const allSections = entries
        .map((e) => `${e.section.course.codigo}/${e.section.codigoSeccion}`)
        .join(", ");
      conflicts.push({
        id: makeId(),
        type: "TEACHER_DOUBLE_BOOKING",
        severity: "critical",
        description: `El docente ${teacher?.nombre} ${teacher?.apellido} tiene ${entries.length} clases asignadas al mismo tiempo (${meeting.diaSemana} ${meeting.timeBlock.horaInicio}-${meeting.timeBlock.horaFin}).`,
        sectionId: section.id,
        teacherId: section.teacherId,
        teacherNombre: teacher ? `${teacher.nombre} ${teacher.apellido}` : "Desconocido",
        diaSemana: meeting.diaSemana,
        timeBlockLabel: `${meeting.timeBlock.horaInicio}-${meeting.timeBlock.horaFin}`,
        suggestions: [
          `Reasignar una de las secciones en conflicto (${allSections}) a otro bloque horario`,
          "Asignar un docente diferente a una de las secciones"
        ]
      });
    }

    // CLASSROOM_DOUBLE_BOOKING
    for (const [, entries] of classroomSlotIndex) {
      if (entries.length < 2) continue;
      const { meeting, section } = entries[0]!;
      const allSections = entries
        .map((e) => `${e.section.course.codigo}/${e.section.codigoSeccion}`)
        .join(", ");
      conflicts.push({
        id: makeId(),
        type: "CLASSROOM_DOUBLE_BOOKING",
        severity: "critical",
        description: `El aula ${meeting.classroom?.codigo ?? meeting.classroomId} tiene ${entries.length} clases asignadas al mismo tiempo (${meeting.diaSemana} ${meeting.timeBlock.horaInicio}-${meeting.timeBlock.horaFin}).`,
        sectionId: section.id,
        classroomId: meeting.classroomId,
        classroomCodigo: meeting.classroom?.codigo,
        diaSemana: meeting.diaSemana,
        timeBlockLabel: `${meeting.timeBlock.horaInicio}-${meeting.timeBlock.horaFin}`,
        suggestions: [
          `Reasignar una de las secciones (${allSections}) a otra aula disponible`,
          "Cambiar el horario de una de las secciones en conflicto"
        ]
      });
    }

    // Per-section checks
    for (const section of sections) {
      const course = section.course;

      // SECTION_WITHOUT_TEACHER
      if (!section.teacherId || !section.teacher) {
        conflicts.push({
          id: makeId(),
          type: "SECTION_WITHOUT_TEACHER",
          severity: "warning",
          description: `La seccion ${course.codigo}/${section.codigoSeccion} no tiene docente asignado.`,
          sectionId: section.id,
          sectionCodigo: section.codigoSeccion,
          courseCodigo: course.codigo,
          courseNombre: course.nombre,
          suggestions: [
            "Ir a Cursos > Secciones y asignar un docente habilitado para este curso",
            "Verificar que existan docentes con este curso en sus cursos asignables"
          ]
        });
        continue;
      }

      // SECTION_UNSCHEDULED
      if (section.scheduleMeetings.length === 0) {
        conflicts.push({
          id: makeId(),
          type: "SECTION_UNSCHEDULED",
          severity: "warning",
          description: `La seccion ${course.codigo}/${section.codigoSeccion} (${section.teacher.nombre} ${section.teacher.apellido}) no tiene horario programado.`,
          sectionId: section.id,
          sectionCodigo: section.codigoSeccion,
          courseCodigo: course.codigo,
          courseNombre: course.nombre,
          teacherNombre: `${section.teacher.nombre} ${section.teacher.apellido}`,
          suggestions: [
            "Usar la generacion automatica de horarios en Asignacion",
            "Programar el horario manualmente en la pantalla de Asignacion"
          ]
        });
        continue;
      }

      // INVALID_SESSION_COUNT
      if (section.scheduleMeetings.length !== course.sesionesPorSemana) {
        conflicts.push({
          id: makeId(),
          type: "INVALID_SESSION_COUNT",
          severity: "warning",
          description: `La seccion ${course.codigo}/${section.codigoSeccion} tiene ${section.scheduleMeetings.length} sesion(es) pero el curso requiere ${course.sesionesPorSemana}.`,
          sectionId: section.id,
          sectionCodigo: section.codigoSeccion,
          courseCodigo: course.codigo,
          courseNombre: course.nombre,
          suggestions: [
            "Ir a Asignacion y corregir el numero de sesiones de esta seccion",
            "Actualizar la configuracion del curso si el numero de sesiones requeridas cambio"
          ]
        });
      }

      // TEACHER_UNAVAILABLE
      if (section.teacher.availabilities.length > 0) {
        for (const meeting of section.scheduleMeetings) {
          const block = meeting.timeBlock;
          const covered = isBlockCoveredByAvailability(
            section.teacher.availabilities,
            meeting.diaSemana,
            block.horaInicio,
            block.horaFin
          );
          if (!covered) {
            conflicts.push({
              id: makeId(),
              type: "TEACHER_UNAVAILABLE",
              severity: "warning",
              description: `El docente ${section.teacher.nombre} ${section.teacher.apellido} esta programado el ${meeting.diaSemana} ${block.horaInicio}-${block.horaFin}, pero no tiene disponibilidad registrada para ese bloque.`,
              sectionId: section.id,
              sectionCodigo: section.codigoSeccion,
              courseCodigo: course.codigo,
              courseNombre: course.nombre,
              teacherId: section.teacherId ?? undefined,
              teacherNombre: `${section.teacher.nombre} ${section.teacher.apellido}`,
              diaSemana: meeting.diaSemana,
              timeBlockLabel: `${block.horaInicio}-${block.horaFin}`,
              suggestions: [
                "Actualizar la disponibilidad del docente en el modulo Docentes",
                "Reasignar la seccion a un bloque dentro de la disponibilidad del docente"
              ]
            });
          }
        }
      }

      // CLASSROOM_UNAVAILABLE
      if (section.classroom && section.classroom.availabilities.length > 0) {
        for (const meeting of section.scheduleMeetings) {
          const block = meeting.timeBlock;
          const covered = isBlockCoveredByAvailability(
            section.classroom.availabilities,
            meeting.diaSemana,
            block.horaInicio,
            block.horaFin
          );
          if (!covered) {
            conflicts.push({
              id: makeId(),
              type: "CLASSROOM_UNAVAILABLE",
              severity: "warning",
              description: `El aula ${section.classroom.codigo} esta programada el ${meeting.diaSemana} ${block.horaInicio}-${block.horaFin}, pero no tiene disponibilidad registrada para ese bloque.`,
              sectionId: section.id,
              classroomId: meeting.classroomId,
              classroomCodigo: section.classroom.codigo,
              diaSemana: meeting.diaSemana,
              timeBlockLabel: `${block.horaInicio}-${block.horaFin}`,
              suggestions: [
                "Actualizar la disponibilidad del aula en el modulo Aulas",
                "Reasignar la seccion a otra aula que este disponible en ese bloque"
              ]
            });
          }
        }
      }

      // CONSECUTIVE_DAYS
      if (avoidConsecutive && section.scheduleMeetings.length > 1) {
        const dayIndices = section.scheduleMeetings
          .map((m: any) => DAY_ORDER.indexOf(m.diaSemana))
          .filter((i: number) => i >= 0)
          .sort((a: number, b: number) => a - b);

        for (let i = 1; i < dayIndices.length; i++) {
          if ((dayIndices[i] ?? 0) - (dayIndices[i - 1] ?? 0) === 1) {
            conflicts.push({
              id: makeId(),
              type: "CONSECUTIVE_DAYS",
              severity: "info",
              description: `La seccion ${course.codigo}/${section.codigoSeccion} tiene sesiones en dias consecutivos. La regla EVITAR_DIAS_CONSECUTIVOS esta activa.`,
              sectionId: section.id,
              sectionCodigo: section.codigoSeccion,
              courseCodigo: course.codigo,
              courseNombre: course.nombre,
              suggestions: [
                "Reasignar una de las sesiones a un dia no consecutivo (ej. L-Mi-V en lugar de L-Ma-Mi)",
                "Desactivar la regla EVITAR_DIAS_CONSECUTIVOS en Franjas Horarias si es aceptable para este caso"
              ]
            });
            break;
          }
        }
      }
    }

    const summary: ConflictSummary = {
      total: conflicts.length,
      critical: conflicts.filter((c) => c.severity === "critical").length,
      warning: conflicts.filter((c) => c.severity === "warning").length,
      info: conflicts.filter((c) => c.severity === "info").length
    };

    return { conflicts, summary, scannedAt: new Date().toISOString() };
  }
}
