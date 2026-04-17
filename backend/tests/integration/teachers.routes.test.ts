import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function buildTeachersServiceMock() {
  return {
    listTeachers: vi.fn().mockResolvedValue([
      {
        id: "teacher-1",
        nombre: "Juan",
        apellido: "Perez",
        email: "juan@test.com",
        departamento: "Matematicas",
        titulo: "Dr.",
        maxHorasSemana: 20,
        activo: true,
        availabilities: [],
        assignableCourses: [],
        disponibilidadConfigurada: false,
        totalCursosAsignables: 0
      }
    ]),
    getTeacherById: vi.fn().mockResolvedValue({
      id: "teacher-1",
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@test.com",
      departamento: "Matematicas",
      titulo: "Dr.",
      maxHorasSemana: 20,
      activo: true,
      availabilities: [],
      assignableCourses: [],
      disponibilidadConfigurada: false,
      totalCursosAsignables: 0
    }),
    createTeacher: vi.fn().mockResolvedValue({
      id: "teacher-1",
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@test.com",
      departamento: "Matematicas",
      titulo: "Dr.",
      maxHorasSemana: 20,
      activo: true,
      availabilities: [],
      assignableCourses: [],
      disponibilidadConfigurada: false,
      totalCursosAsignables: 0
    }),
    updateTeacher: vi.fn().mockResolvedValue({
      id: "teacher-1",
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@test.com",
      departamento: "Matematicas",
      titulo: "Dr.",
      maxHorasSemana: 20,
      activo: true,
      availabilities: [],
      assignableCourses: [],
      disponibilidadConfigurada: false,
      totalCursosAsignables: 0
    }),
    deleteTeacher: vi.fn().mockResolvedValue(undefined),
    updateTeacherAvailability: vi.fn().mockResolvedValue({
      id: "teacher-1",
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@test.com",
      departamento: "Matematicas",
      titulo: "Dr.",
      maxHorasSemana: 20,
      activo: true,
      availabilities: [{ id: "a1", diaSemana: "lunes", horaInicio: "07:00", horaFin: "09:00", activo: true }],
      assignableCourses: [],
      disponibilidadConfigurada: true,
      totalCursosAsignables: 0
    }),
    updateTeacherAssignableCourses: vi.fn().mockResolvedValue({
      id: "teacher-1",
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@test.com",
      departamento: "Matematicas",
      titulo: "Dr.",
      maxHorasSemana: 20,
      activo: true,
      availabilities: [],
      assignableCourses: [{ id: "c1", codigoCurso: "MAT-101", nombreCurso: "Calculo I", activo: true }],
      disponibilidadConfigurada: false,
      totalCursosAsignables: 1
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

describe("teachers integration", () => {
  it("lista docentes autenticado como admin", async () => {
    const app = createApp({ teachersService: buildTeachersServiceMock() as any });
    const response = await request(app).get("/api/v1/teachers").set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
  });

  it("crea docente", async () => {
    const app = createApp({ teachersService: buildTeachersServiceMock() as any });
    const response = await request(app)
      .post("/api/v1/teachers")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        nombre: "Juan",
        apellido: "Perez",
        email: "juan@test.com",
        departamento: "Matematicas",
        titulo: "Dr.",
        maxHorasSemana: 20,
        activo: true
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it("actualiza disponibilidad del docente", async () => {
    const app = createApp({ teachersService: buildTeachersServiceMock() as any });
    const response = await request(app)
      .put("/api/v1/teachers/teacher-1/availability")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        availability: [{ diaSemana: "lunes", horaInicio: "07:00", horaFin: "09:00", activo: true }]
      });

    expect(response.status).toBe(200);
    expect(response.body.data.item.disponibilidadConfigurada).toBe(true);
  });
});
