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
