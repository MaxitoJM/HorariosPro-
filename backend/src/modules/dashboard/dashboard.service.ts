export class DashboardService {
  constructor(private readonly prisma: any) {}

  async getSummary() {
    const [teachers, courses, classrooms, scheduledSections, meetings, recentAuditLogs] = await Promise.all([
      this.prisma.teacher.count({ where: { activo: true } }),
      this.prisma.course.count({ where: { activo: true } }),
      this.prisma.classroom.count({ where: { activo: true } }),
      this.prisma.courseSection.count({
        where: {
          scheduleMeetings: {
            some: {}
          }
        }
      }),
      this.prisma.sectionScheduleMeeting.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6
      })
    ]);

    const totalSections = await this.prisma.courseSection.count();
    const totalAssignableCapacity = await this.prisma.classroom.aggregate({ _sum: { capacidad: true } });

    return {
      stats: {
        teachers,
        courses,
        classrooms,
        meetings,
        scheduledSections,
        pendingSections: Math.max(totalSections - scheduledSections, 0),
        totalAssignableCapacity: totalAssignableCapacity._sum.capacidad ?? 0,
        schedulingProgress: totalSections > 0 ? Math.round((scheduledSections / totalSections) * 100) : 0
      },
      recentActivity: recentAuditLogs.map((item: any) => ({
        id: item.id,
        action: item.action,
        createdAt: item.createdAt
      }))
    };
  }
}
