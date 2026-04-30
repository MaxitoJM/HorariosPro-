import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function buildSchedulingServiceMock() {
  return {
    getManualContext: vi.fn().mockResolvedValue({
      section: {
        id: "section-1",
        codigoSeccion: "A",
        assignedMeetings: [],
        course: { codigo: "MAT-101", nombre: "Calculo I" },
        teacher: { id: "teacher-1", nombre: "Juan", apellido: "Perez" }
      },
      requiredSessions: 3,
      slotOptions: [],
      classroomOptions: []
    }),
    saveManualAssignment: vi.fn().mockResolvedValue({
      section: {
        id: "section-1",
        codigoSeccion: "A",
        assignedMeetings: [
          { diaSemana: "lunes", timeBlockId: "block-1" },
          { diaSemana: "miercoles", timeBlockId: "block-1" },
          { diaSemana: "viernes", timeBlockId: "block-1" }
        ],
        course: { codigo: "MAT-101", nombre: "Calculo I" },
        teacher: { id: "teacher-1", nombre: "Juan", apellido: "Perez" }
      },
      requiredSessions: 3,
      slotOptions: [],
      classroomOptions: []
    }),
    getOverview: vi.fn().mockResolvedValue({
      view: "all",
      entityId: null,
      counts: { totalMeetings: 3, totalSectionsScheduled: 1, totalCoursesScheduled: 1 },
      meetings: []
    }),
    detectConflicts: vi.fn().mockResolvedValue({
      conflicts: [
        {
          id: "conflict-1",
          type: "SECTION_UNSCHEDULED",
          severity: "warning",
          description: "La seccion MAT-101/A no tiene horario programado.",
          sectionId: "section-1",
          suggestions: ["Programar el horario manualmente"]
        }
      ],
      summary: { total: 1, critical: 0, warning: 1, info: 0 },
      scannedAt: "2026-01-01T00:00:00.000Z"
    }),
    autoGenerate: vi.fn().mockResolvedValue({
      assigned: [
        {
          sectionId: "section-1",
          sectionLabel: "MAT-101/A",
          classroomCodigo: "AULA-101",
          meetingLabels: ["lunes 07:00-08:30", "miercoles 07:00-08:30", "viernes 07:00-08:30"]
        }
      ],
      skipped: [],
      total: 1
    }),
    reassignSection: vi.fn().mockResolvedValue({
      section: {
        id: "section-1",
        codigoSeccion: "A",
        assignedMeetings: [
          { diaSemana: "martes", timeBlockId: "block-2" },
          { diaSemana: "jueves", timeBlockId: "block-2" }
        ],
        course: { codigo: "MAT-101", nombre: "Calculo I" },
        teacher: { id: "teacher-1", nombre: "Juan", apellido: "Perez" }
      },
      requiredSessions: 2,
      slotOptions: [],
      classroomOptions: []
    })
  };
}

function buildDashboardServiceMock() {
  return {
    getSummary: vi.fn().mockResolvedValue({
      stats: {
        teachers: 3,
        courses: 3,
        classrooms: 3,
        meetings: 7,
        scheduledSections: 3,
        pendingSections: 1,
        totalAssignableCapacity: 179,
        schedulingProgress: 75
      },
      recentActivity: []
    })
  };
}

function adminToken() {
  return signAccessToken({
    sub: "admin-1",
    email: "admin@test.com",
    rol: "admin"
  });
}

describe("scheduling integration", () => {
  it("consulta contexto de asignacion manual", async () => {
    const app = createApp({ schedulingService: buildSchedulingServiceMock() as any });
    const response = await request(app)
      .get("/api/v1/scheduling/sections/section-1/manual-context")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.requiredSessions).toBe(3);
  });

  it("guarda asignacion manual", async () => {
    const app = createApp({ schedulingService: buildSchedulingServiceMock() as any });
    const response = await request(app)
      .put("/api/v1/scheduling/sections/section-1/manual-assignment")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        classroomId: "classroom-1",
        meetings: [
          { diaSemana: "lunes", timeBlockId: "block-1" },
          { diaSemana: "miercoles", timeBlockId: "block-1" },
          { diaSemana: "viernes", timeBlockId: "block-1" }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("consulta overview de horarios", async () => {
    const app = createApp({ schedulingService: buildSchedulingServiceMock() as any });
    const response = await request(app)
      .get("/api/v1/scheduling/overview?view=all")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.counts.totalMeetings).toBe(3);
  });

  it("detecta conflictos de horario", async () => {
    const app = createApp({ schedulingService: buildSchedulingServiceMock() as any });
    const response = await request(app)
      .get("/api/v1/scheduling/conflicts")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.summary.total).toBe(1);
    expect(response.body.data.summary.warning).toBe(1);
    expect(response.body.data.conflicts[0].type).toBe("SECTION_UNSCHEDULED");
  });

  it("genera horarios automaticamente", async () => {
    const app = createApp({ schedulingService: buildSchedulingServiceMock() as any });
    const response = await request(app)
      .post("/api/v1/scheduling/auto-generate")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.assigned).toHaveLength(1);
    expect(response.body.data.assigned[0].sectionLabel).toBe("MAT-101/A");
    expect(response.body.data.skipped).toHaveLength(0);
  });

  it("reasigna seccion automaticamente", async () => {
    const app = createApp({ schedulingService: buildSchedulingServiceMock() as any });
    const response = await request(app)
      .post("/api/v1/scheduling/sections/section-1/reassign")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.section.assignedMeetings).toHaveLength(2);
    expect(response.body.data.section.assignedMeetings[0].diaSemana).toBe("martes");
  });
});

describe("dashboard integration", () => {
  it("consulta resumen del dashboard", async () => {
    const app = createApp({ dashboardService: buildDashboardServiceMock() as any });
    const response = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.stats.schedulingProgress).toBe(75);
  });
});
