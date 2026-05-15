import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function buildReportsServiceMock() {
  return {
    getScheduleReport: vi.fn().mockResolvedValue({
      generatedAt: "2026-01-01T00:00:00.000Z",
      summary: {
        totalSections: 2,
        scheduledSections: 1,
        pendingSections: 1,
        scheduledMeetings: 3,
        requiredMeetings: 6,
        completionPercentage: 50,
        scheduledHours: 4.5
      },
      byDay: [],
      byDepartment: [],
      meetings: [],
      unscheduledSections: []
    }),
    exportScheduleCsv: vi.fn().mockResolvedValue({
      filename: "horarios-2026-01-01.csv",
      content: "Dia,Inicio,Fin\nlunes,07:00,08:30"
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

describe("reports integration", () => {
  it("consulta reporte general de horarios", async () => {
    const reportsService = buildReportsServiceMock();
    const app = createApp({ reportsService: reportsService as any });

    const response = await request(app)
      .get("/api/v1/reports/schedule?view=all&includeUnscheduled=true")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.summary.completionPercentage).toBe(50);
    expect(reportsService.getScheduleReport).toHaveBeenCalledWith(
      expect.objectContaining({ view: "all", includeUnscheduled: true })
    );
  });

  it("exporta horarios en CSV", async () => {
    const app = createApp({ reportsService: buildReportsServiceMock() as any });

    const response = await request(app)
      .get("/api/v1/reports/schedule/export?format=csv")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.text).toContain("Dia,Inicio,Fin");
  });
});
