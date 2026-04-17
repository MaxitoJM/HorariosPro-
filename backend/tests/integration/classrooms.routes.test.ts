import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function buildClassroomsServiceMock() {
  return {
    listClassrooms: vi.fn().mockResolvedValue([
      {
        id: "classroom-1",
        codigo: "A-301",
        edificio: "Edificio A",
        piso: "3",
        tipo: "aula",
        capacidad: 35,
        equipamiento: ["Proyector", "Pizarra"],
        activo: true,
        sections: [],
        availabilities: [],
        totalSeccionesAsignadas: 0,
        disponibilidadConfigurada: false
      }
    ]),
    getClassroomById: vi.fn().mockResolvedValue({
      id: "classroom-1",
      codigo: "A-301",
      edificio: "Edificio A",
      piso: "3",
      tipo: "aula",
      capacidad: 35,
      equipamiento: ["Proyector", "Pizarra"],
      activo: true,
      sections: [],
      availabilities: [],
      totalSeccionesAsignadas: 0,
      disponibilidadConfigurada: false
    }),
    createClassroom: vi.fn().mockResolvedValue({
      id: "classroom-1",
      codigo: "A-301",
      edificio: "Edificio A",
      piso: "3",
      tipo: "aula",
      capacidad: 35,
      equipamiento: ["Proyector", "Pizarra"],
      activo: true,
      sections: [],
      availabilities: [],
      totalSeccionesAsignadas: 0,
      disponibilidadConfigurada: false
    }),
    updateClassroom: vi.fn().mockResolvedValue({
      id: "classroom-1",
      codigo: "A-301",
      edificio: "Edificio A",
      piso: "3",
      tipo: "aula",
      capacidad: 35,
      equipamiento: ["Proyector", "Pizarra"],
      activo: true,
      sections: [],
      availabilities: [],
      totalSeccionesAsignadas: 0,
      disponibilidadConfigurada: false
    }),
    deleteClassroom: vi.fn().mockResolvedValue(undefined),
    updateClassroomAvailability: vi.fn().mockResolvedValue({
      id: "classroom-1",
      codigo: "A-301",
      edificio: "Edificio A",
      piso: "3",
      tipo: "aula",
      capacidad: 35,
      equipamiento: ["Proyector", "Pizarra"],
      activo: true,
      sections: [],
      availabilities: [{ id: "av-1", diaSemana: "lunes", horaInicio: "07:00", horaFin: "18:00", activo: true }],
      totalSeccionesAsignadas: 0,
      disponibilidadConfigurada: true
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

describe("classrooms integration", () => {
  it("lista aulas autenticado como admin", async () => {
    const app = createApp({ classroomsService: buildClassroomsServiceMock() as any });
    const response = await request(app).get("/api/v1/classrooms").set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
  });

  it("crea aula", async () => {
    const app = createApp({ classroomsService: buildClassroomsServiceMock() as any });
    const response = await request(app)
      .post("/api/v1/classrooms")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        codigo: "A-301",
        edificio: "Edificio A",
        piso: "3",
        tipo: "aula",
        capacidad: 35,
        equipamiento: ["Proyector", "Pizarra"],
        activo: true
      });

    expect(response.status).toBe(201);
    expect(response.body.data.item.codigo).toBe("A-301");
  });

  it("actualiza disponibilidad del aula", async () => {
    const app = createApp({ classroomsService: buildClassroomsServiceMock() as any });
    const response = await request(app)
      .put("/api/v1/classrooms/classroom-1/availability")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        availability: [{ diaSemana: "lunes", horaInicio: "07:00", horaFin: "18:00", activo: true }]
      });

    expect(response.status).toBe(200);
    expect(response.body.data.item.disponibilidadConfigurada).toBe(true);
  });
});
