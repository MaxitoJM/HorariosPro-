import type { PrismaClient } from "@prisma/client";
import { DAY_ORDER, parseTimeToMinutes } from "../../utils/time.js";

type ScheduleView = "all" | "teacher" | "classroom" | "course";

type ScheduleReportFilters = {
  view: ScheduleView;
  includeUnscheduled: boolean;
  entityId?: string;
  department?: string;
};

const REPORT_DAYS = DAY_ORDER.slice(0, 6);

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export class ReportsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getScheduleReport(filters: ScheduleReportFilters) {
    const sectionWhere = this.buildSectionWhere(filters);
    const meetingWhere = this.buildMeetingWhere(filters, sectionWhere);

    const [meetings, sections] = await Promise.all([
      this.prisma.sectionScheduleMeeting.findMany({
        where: meetingWhere,
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
        }
      }),
      this.prisma.courseSection.findMany({
        where: sectionWhere,
        include: {
          course: true,
          teacher: true,
          classroom: true,
          scheduleMeetings: {
            include: {
              timeBlock: true
            }
          }
        }
      })
    ]);

    const sortedMeetings = [...meetings].sort((a: any, b: any) => {
      const dayDiff = DAY_ORDER.indexOf(a.diaSemana) - DAY_ORDER.indexOf(b.diaSemana);
      if (dayDiff !== 0) return dayDiff;
      return parseTimeToMinutes(a.timeBlock.horaInicio) - parseTimeToMinutes(b.timeBlock.horaInicio);
    });

    const meetingItems = sortedMeetings.map((item: any) => ({
      id: item.id,
      diaSemana: item.diaSemana,
      horaInicio: item.timeBlock.horaInicio,
      horaFin: item.timeBlock.horaFin,
      duracionMinutos: item.timeBlock.duracionMinutos,
      grupo: item.timeBlock.grupo.nombre,
      courseId: item.section.courseId,
      courseCodigo: item.section.course.codigo,
      courseNombre: item.section.course.nombre,
      departamento: item.section.course.departamento,
      sectionId: item.sectionId,
      sectionCodigo: item.section.codigoSeccion,
      teacherId: item.section.teacherId,
      teacherNombre: item.section.teacher ? `${item.section.teacher.nombre} ${item.section.teacher.apellido}` : "Sin docente",
      classroomId: item.classroomId,
      classroomNombre: `${item.classroom.codigo} - ${item.classroom.edificio}`,
      inscritos: item.section.inscritos,
      capacidad: item.section.capacidad
    }));

    const unscheduledSections = sections
      .filter((section: any) => section.scheduleMeetings.length === 0)
      .map((section: any) => ({
        id: section.id,
        courseCodigo: section.course.codigo,
        courseNombre: section.course.nombre,
        departamento: section.course.departamento,
        sectionCodigo: section.codigoSeccion,
        teacherNombre: section.teacher ? `${section.teacher.nombre} ${section.teacher.apellido}` : "Sin docente",
        classroomNombre: section.classroom ? `${section.classroom.codigo} - ${section.classroom.edificio}` : "Sin aula",
        inscritos: section.inscritos,
        capacidad: section.capacidad,
        sesionesRequeridas: section.course.sesionesPorSemana
      }));

    const totalRequiredSessions = sections.reduce((acc: number, section: any) => acc + section.course.sesionesPorSemana, 0);
    const scheduledSections = sections.filter((section: any) => section.scheduleMeetings.length > 0).length;
    const scheduledMinutes = meetingItems.reduce((acc, item) => acc + item.duracionMinutos, 0);

    return {
      generatedAt: new Date().toISOString(),
      filters,
      summary: {
        totalSections: sections.length,
        scheduledSections,
        pendingSections: Math.max(sections.length - scheduledSections, 0),
        scheduledMeetings: meetingItems.length,
        requiredMeetings: totalRequiredSessions,
        completionPercentage: totalRequiredSessions > 0 ? Math.round((meetingItems.length / totalRequiredSessions) * 100) : 0,
        scheduledHours: round(scheduledMinutes / 60)
      },
      byDay: REPORT_DAYS.map((day) => ({
        diaSemana: day,
        totalMeetings: meetingItems.filter((meeting) => meeting.diaSemana === day).length
      })),
      byDepartment: this.groupSectionsByDepartment(sections),
      meetings: meetingItems,
      unscheduledSections: filters.includeUnscheduled ? unscheduledSections : []
    };
  }

  async exportScheduleCsv(filters: ScheduleReportFilters) {
    const report = await this.getScheduleReport(filters);
    const rows = [
      ["Dia", "Inicio", "Fin", "Curso", "Nombre curso", "Seccion", "Docente", "Aula", "Departamento", "Inscritos", "Capacidad"],
      ...report.meetings.map((meeting: any) => [
        meeting.diaSemana,
        meeting.horaInicio,
        meeting.horaFin,
        meeting.courseCodigo,
        meeting.courseNombre,
        meeting.sectionCodigo,
        meeting.teacherNombre,
        meeting.classroomNombre,
        meeting.departamento,
        meeting.inscritos,
        meeting.capacidad
      ])
    ];

    return {
      filename: `horarios-${new Date().toISOString().slice(0, 10)}.csv`,
      content: buildCsv(rows)
    };
  }

  // ── Reportes academicos (Fase 3) ──────────────────────────────────────────

  // Estudiantes inscritos por seccion/curso. Filtrable por periodo, curso y programa.
  async getEnrollmentsReport(filters: { periodoId?: string; courseId?: string; programId?: string } = {}) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        estado: "inscrito",
        ...(filters.periodoId ? { periodoId: filters.periodoId } : {}),
        ...(filters.courseId ? { section: { courseId: filters.courseId } } : {}),
        ...(filters.programId ? { student: { programId: filters.programId } } : {})
      },
      include: {
        student: { include: { program: true } },
        periodo: true,
        section: { include: { course: true } }
      },
      orderBy: [{ createdAt: "asc" }]
    });

    const items = enrollments.map((e) => ({
      enrollmentId: e.id,
      estudianteCodigo: e.student.codigo,
      estudianteNombre: `${e.student.nombre} ${e.student.apellido}`,
      estudianteEmail: e.student.email,
      programa: e.student.program?.nombre ?? "",
      cursoCodigo: e.section.course.codigo,
      cursoNombre: e.section.course.nombre,
      seccion: e.section.codigoSeccion,
      periodo: e.periodo.codigo
    }));

    return { total: items.length, items };
  }

  async exportEnrollmentsCsv(filters: { periodoId?: string; courseId?: string; programId?: string } = {}) {
    const report = await this.getEnrollmentsReport(filters);
    const rows = [
      ["Codigo estudiante", "Estudiante", "Email", "Programa", "Curso", "Nombre curso", "Seccion", "Periodo"],
      ...report.items.map((i) => [
        i.estudianteCodigo,
        i.estudianteNombre,
        i.estudianteEmail,
        i.programa,
        i.cursoCodigo,
        i.cursoNombre,
        i.seccion,
        i.periodo
      ])
    ];
    return { filename: `inscritos-${new Date().toISOString().slice(0, 10)}.csv`, content: buildCsv(rows) };
  }

  // Demanda de cursos: total de inscritos activos por curso, ordenado desc.
  async getCourseDemandReport(filters: { periodoId?: string } = {}) {
    const courses = await this.prisma.course.findMany({
      include: {
        sections: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: {
                enrollments: {
                  where: { estado: "inscrito", ...(filters.periodoId ? { periodoId: filters.periodoId } : {}) }
                }
              }
            }
          }
        }
      }
    });

    const items = courses
      .map((c) => {
        const inscritos = c.sections.reduce((acc, s) => acc + s._count.enrollments, 0);
        const capacidad = c.sections.reduce((acc, s) => acc + s.capacidad, 0);
        return {
          cursoCodigo: c.codigo,
          cursoNombre: c.nombre,
          departamento: c.departamento,
          secciones: c.sections.length,
          inscritos,
          capacidad,
          ocupacion: capacidad > 0 ? round((inscritos / capacidad) * 100) : 0
        };
      })
      .sort((a, b) => b.inscritos - a.inscritos);

    return { total: items.length, items };
  }

  async exportCourseDemandCsv(filters: { periodoId?: string } = {}) {
    const report = await this.getCourseDemandReport(filters);
    const rows = [
      ["Curso", "Nombre", "Departamento", "Secciones", "Inscritos", "Capacidad", "Ocupacion %"],
      ...report.items.map((i) => [
        i.cursoCodigo,
        i.cursoNombre,
        i.departamento,
        i.secciones,
        i.inscritos,
        i.capacidad,
        i.ocupacion
      ])
    ];
    return { filename: `demanda-cursos-${new Date().toISOString().slice(0, 10)}.csv`, content: buildCsv(rows) };
  }

  // Ocupacion de aulas: reuniones programadas y capacidad por aula.
  async getClassroomOccupancyReport() {
    const classrooms = await this.prisma.classroom.findMany({
      include: { _count: { select: { scheduleMeetings: true } } },
      orderBy: [{ edificio: "asc" }, { codigo: "asc" }]
    });

    const items = classrooms.map((c) => ({
      aulaCodigo: c.codigo,
      edificio: c.edificio,
      tipo: c.tipo,
      capacidad: c.capacidad,
      reunionesProgramadas: c._count.scheduleMeetings
    }));

    return { total: items.length, items };
  }

  async exportClassroomOccupancyCsv() {
    const report = await this.getClassroomOccupancyReport();
    const rows = [
      ["Aula", "Edificio", "Tipo", "Capacidad", "Reuniones programadas"],
      ...report.items.map((i) => [i.aulaCodigo, i.edificio, i.tipo, i.capacidad, i.reunionesProgramadas])
    ];
    return { filename: `ocupacion-aulas-${new Date().toISOString().slice(0, 10)}.csv`, content: buildCsv(rows) };
  }

  private buildSectionWhere(filters: ScheduleReportFilters) {
    const where: any = { activo: true };

    if (filters.view === "teacher" && filters.entityId) {
      where.teacherId = filters.entityId;
    }

    if (filters.view === "classroom" && filters.entityId) {
      where.classroomId = filters.entityId;
    }

    if (filters.view === "course" && filters.entityId) {
      where.courseId = filters.entityId;
    }

    if (filters.department) {
      where.course = { departamento: filters.department };
    }

    return where;
  }

  private buildMeetingWhere(filters: ScheduleReportFilters, sectionWhere: any) {
    const where: any = { section: sectionWhere };

    if (filters.view === "classroom" && filters.entityId) {
      where.classroomId = filters.entityId;
    }

    return where;
  }

  private groupSectionsByDepartment(sections: any[]) {
    const grouped = new Map<string, { departamento: string; totalSections: number; scheduledSections: number; pendingSections: number }>();

    for (const section of sections) {
      const departamento = section.course.departamento;
      const current = grouped.get(departamento) ?? {
        departamento,
        totalSections: 0,
        scheduledSections: 0,
        pendingSections: 0
      };

      current.totalSections += 1;
      if (section.scheduleMeetings.length > 0) {
        current.scheduledSections += 1;
      } else {
        current.pendingSections += 1;
      }
      grouped.set(departamento, current);
    }

    return Array.from(grouped.values()).sort((a, b) => a.departamento.localeCompare(b.departamento));
  }
}
