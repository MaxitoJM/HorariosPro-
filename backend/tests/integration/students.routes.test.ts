import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function adminToken() {
  return signAccessToken({ sub: "admin-1", email: "admin@test.com", rol: "admin" });
}

function buildStudentsServiceMock() {
  return {
    listStudents: vi.fn().mockResolvedValue([
      {
        id: "student-1",
        nombre: "Maria",
        apellido: "Gomez",
        email: "maria@test.com",
        totalInscripciones: 1
      }
    ]),
    getStudentById: vi.fn().mockResolvedValue({
      id: "student-1",
      nombre: "Maria",
      apellido: "Gomez",
      email: "maria@test.com",
      totalInscripciones: 1
    }),
    createStudent: vi.fn().mockResolvedValue({
      id: "student-2",
      nombre: "Carlos",
      apellido: "Diaz",
      email: "carlos@test.com",
      totalInscripciones: 0
    })
  };
}

describe("students integration", () => {
  it("consulta estudiantes registrados", async () => {
    const app = createApp({ studentsService: buildStudentsServiceMock() as any });

    const response = await request(app)
      .get("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].email).toBe("maria@test.com");
  });

  it("consulta detalle de estudiante", async () => {
    const app = createApp({ studentsService: buildStudentsServiceMock() as any });

    const response = await request(app)
      .get("/api/v1/students/student-1")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.item.totalInscripciones).toBe(1);
  });

  it("registra estudiante", async () => {
    const app = createApp({ studentsService: buildStudentsServiceMock() as any });

    const response = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        nombre: "Carlos",
        apellido: "Diaz",
        email: "carlos@test.com",
        password: "Admin12345*",
        activo: true,
        verificado: false
      });

    expect(response.status).toBe(201);
    expect(response.body.data.item.email).toBe("carlos@test.com");
  });
});
