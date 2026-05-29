import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function adminToken() {
  return signAccessToken({ sub: "admin-1", email: "admin@test.com", rol: "admin" });
}

function buildAcademicPeriodsServiceMock() {
  return {
    listPeriods: vi.fn().mockResolvedValue([{ id: "p1", codigo: "2026-1", esActual: true }]),
    getPeriodById: vi.fn().mockResolvedValue({ id: "p1", codigo: "2026-1" }),
    createPeriod: vi.fn().mockResolvedValue({ id: "p2", codigo: "2026-2" }),
    updatePeriod: vi.fn().mockResolvedValue({ id: "p1", codigo: "2026-1" }),
    deletePeriod: vi.fn().mockResolvedValue(undefined),
    restorePeriod: vi.fn().mockResolvedValue({ id: "p1", codigo: "2026-1" }),
    setCurrentPeriod: vi.fn().mockResolvedValue({ id: "p1", esActual: true })
  };
}

function buildProgramsServiceMock() {
  return {
    listPrograms: vi.fn().mockResolvedValue([{ id: "pr1", codigo: "ING", nombre: "Ingenieria" }]),
    getProgramById: vi.fn().mockResolvedValue({ id: "pr1", codigo: "ING" }),
    createProgram: vi.fn().mockResolvedValue({ id: "pr2", codigo: "MED" }),
    updateProgram: vi.fn().mockResolvedValue({ id: "pr1", codigo: "ING" }),
    deleteProgram: vi.fn().mockResolvedValue(undefined),
    restoreProgram: vi.fn().mockResolvedValue({ id: "pr1", codigo: "ING" })
  };
}

function buildStudentsServiceMock() {
  return {
    listStudents: vi.fn().mockResolvedValue({
      items: [{ id: "s1", codigo: "E1", email: "e1@test.com" }],
      pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1 }
    }),
    getStudentById: vi.fn().mockResolvedValue({ id: "s1", codigo: "E1" }),
    createStudent: vi.fn().mockResolvedValue({ id: "s2", codigo: "E2" }),
    updateStudent: vi.fn().mockResolvedValue({ id: "s1", codigo: "E1" }),
    deleteStudent: vi.fn().mockResolvedValue(undefined),
    restoreStudent: vi.fn().mockResolvedValue({ id: "s1", codigo: "E1" })
  };
}

function buildEnrollmentsServiceMock() {
  return {
    listEnrollments: vi.fn().mockResolvedValue([{ id: "en1", estado: "inscrito" }]),
    getEnrollmentById: vi.fn().mockResolvedValue({ id: "en1", estado: "inscrito" }),
    enroll: vi.fn().mockResolvedValue({ id: "en1", estado: "inscrito", sectionId: "sec1", studentId: "s1" }),
    withdraw: vi.fn().mockResolvedValue(undefined),
    setStatus: vi.fn().mockResolvedValue({ id: "en1", estado: "aprobado" })
  };
}

describe("academic-periods integration", () => {
  it("lista periodos", async () => {
    const app = createApp({ academicPeriodsService: buildAcademicPeriodsServiceMock() as any });
    const res = await request(app).get("/api/v1/academic-periods").set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].codigo).toBe("2026-1");
  });

  it("crea periodo", async () => {
    const app = createApp({ academicPeriodsService: buildAcademicPeriodsServiceMock() as any });
    const res = await request(app)
      .post("/api/v1/academic-periods")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        codigo: "2026-2",
        nombre: "Segundo Semestre 2026",
        fechaInicio: "2026-07-20T00:00:00.000Z",
        fechaFin: "2026-12-05T00:00:00.000Z"
      });
    expect(res.status).toBe(201);
    expect(res.body.data.item.codigo).toBe("2026-2");
  });

  it("marca periodo como actual", async () => {
    const app = createApp({ academicPeriodsService: buildAcademicPeriodsServiceMock() as any });
    const res = await request(app)
      .post("/api/v1/academic-periods/p1/set-current")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.item.esActual).toBe(true);
  });
});

describe("programs integration", () => {
  it("lista programas", async () => {
    const app = createApp({ programsService: buildProgramsServiceMock() as any });
    const res = await request(app).get("/api/v1/programs").set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].codigo).toBe("ING");
  });

  it("crea programa", async () => {
    const app = createApp({ programsService: buildProgramsServiceMock() as any });
    const res = await request(app)
      .post("/api/v1/programs")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ codigo: "MED", nombre: "Medicina", departamento: "Salud" });
    expect(res.status).toBe(201);
    expect(res.body.data.item.codigo).toBe("MED");
  });
});

describe("students integration", () => {
  it("lista estudiantes con paginacion", async () => {
    const app = createApp({ studentsService: buildStudentsServiceMock() as any });
    const res = await request(app).get("/api/v1/students").set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.items[0].codigo).toBe("E1");
  });

  it("crea estudiante", async () => {
    const app = createApp({ studentsService: buildStudentsServiceMock() as any });
    const res = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ codigo: "E2", nombre: "Beto", apellido: "Ruiz", email: "beto@test.com" });
    expect(res.status).toBe(201);
    expect(res.body.data.item.codigo).toBe("E2");
  });

  it("rechaza estudiante con email invalido (400)", async () => {
    const app = createApp({ studentsService: buildStudentsServiceMock() as any });
    const res = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ codigo: "E3", nombre: "Mal", apellido: "Email", email: "no-es-email" });
    expect(res.status).toBe(400);
  });
});

describe("enrollments integration", () => {
  it("inscribe estudiante", async () => {
    const app = createApp({ enrollmentsService: buildEnrollmentsServiceMock() as any });
    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ studentId: "s1", sectionId: "sec1" });
    expect(res.status).toBe(201);
    expect(res.body.data.item.estado).toBe("inscrito");
  });

  it("retira inscripcion", async () => {
    const app = createApp({ enrollmentsService: buildEnrollmentsServiceMock() as any });
    const res = await request(app)
      .delete("/api/v1/enrollments/en1")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("cambia estado de inscripcion", async () => {
    const app = createApp({ enrollmentsService: buildEnrollmentsServiceMock() as any });
    const res = await request(app)
      .patch("/api/v1/enrollments/en1/status")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ estado: "aprobado" });
    expect(res.status).toBe(200);
    expect(res.body.data.item.estado).toBe("aprobado");
  });
});
