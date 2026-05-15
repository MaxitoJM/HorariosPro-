import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function studentToken() {
  return signAccessToken({ sub: "student-1", email: "student@test.com", rol: "estudiante" });
}

function buildEnrollmentsServiceMock() {
  return {
    getEnrollmentContext: vi.fn().mockResolvedValue({
      enrolled: [],
      availableSections: [
        {
          id: "section-1",
          courseCodigo: "MAT-101",
          sectionCodigo: "A",
          canEnroll: true,
          disabledReason: null
        }
      ]
    }),
    enroll: vi.fn().mockResolvedValue({
      enrolled: [{ id: "enrollment-1", sectionId: "section-1" }],
      availableSections: []
    }),
    withdraw: vi.fn().mockResolvedValue({
      enrolled: [],
      availableSections: []
    })
  };
}

describe("enrollments integration", () => {
  it("consulta opciones de inscripcion del estudiante", async () => {
    const app = createApp({ enrollmentsService: buildEnrollmentsServiceMock() as any });

    const response = await request(app)
      .get("/api/v1/enrollments/me")
      .set("Authorization", `Bearer ${studentToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.availableSections[0].canEnroll).toBe(true);
  });

  it("inscribe estudiante a un grupo", async () => {
    const app = createApp({ enrollmentsService: buildEnrollmentsServiceMock() as any });

    const response = await request(app)
      .post("/api/v1/enrollments/me")
      .set("Authorization", `Bearer ${studentToken()}`)
      .send({ sectionId: "section-1" });

    expect(response.status).toBe(201);
    expect(response.body.data.enrolled[0].sectionId).toBe("section-1");
  });

  it("retira una inscripcion", async () => {
    const app = createApp({ enrollmentsService: buildEnrollmentsServiceMock() as any });

    const response = await request(app)
      .delete("/api/v1/enrollments/me/enrollment-1")
      .set("Authorization", `Bearer ${studentToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.enrolled).toHaveLength(0);
  });
});
