import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function buildScheduleConfigServiceMock() {
  return {
    listTimeSlotGroups: vi.fn().mockResolvedValue([
      {
        id: "group-1",
        nombre: "Manana",
        horaInicio: "07:00",
        horaFin: "12:00",
        activo: true,
        timeBlocks: []
      }
    ]),
    createTimeSlotGroup: vi.fn().mockResolvedValue({
      id: "group-1",
      nombre: "Manana",
      horaInicio: "07:00",
      horaFin: "12:00",
      activo: true
    }),
    updateTimeSlotGroup: vi.fn().mockResolvedValue({
      id: "group-1",
      nombre: "Manana",
      horaInicio: "07:00",
      horaFin: "12:00",
      activo: true
    }),
    deleteTimeSlotGroup: vi.fn().mockResolvedValue(undefined),
    listTimeBlocks: vi.fn().mockResolvedValue([]),
    createTimeBlock: vi.fn().mockResolvedValue({
      id: "block-1",
      grupoId: "group-1",
      nombre: "Bloque 1",
      horaInicio: "07:00",
      horaFin: "08:30",
      duracionMinutos: 90,
      orden: 1,
      activo: true,
      grupoNombre: "Manana"
    }),
    updateTimeBlock: vi.fn().mockResolvedValue({
      id: "block-1",
      grupoId: "group-1",
      nombre: "Bloque 1",
      horaInicio: "07:00",
      horaFin: "08:30",
      duracionMinutos: 90,
      orden: 1,
      activo: true,
      grupoNombre: "Manana"
    }),
    deleteTimeBlock: vi.fn().mockResolvedValue(undefined),
    listRules: vi.fn().mockResolvedValue([]),
    updateRules: vi.fn().mockResolvedValue([]),
    getAcademicConfig: vi.fn().mockResolvedValue({
      id: "config-1",
      nombre: "Configuracion general",
      sesionesPorSemanaDefault: 3,
      duracionSesionDefault: 90,
      diasHabiles: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
      activo: true
    }),
    updateAcademicConfig: vi.fn().mockResolvedValue({
      id: "config-1",
      nombre: "Configuracion general",
      sesionesPorSemanaDefault: 3,
      duracionSesionDefault: 90,
      diasHabiles: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
      activo: true
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

describe("schedule-config integration", () => {
  it("lista franjas para un admin autenticado", async () => {
    const app = createApp({ scheduleConfigService: buildScheduleConfigServiceMock() as any });
    const response = await request(app)
      .get("/api/v1/schedule-config/time-slot-groups")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
  });

  it("rechaza la consulta sin token", async () => {
    const app = createApp({ scheduleConfigService: buildScheduleConfigServiceMock() as any });
    const response = await request(app).get("/api/v1/schedule-config/time-slot-groups");

    expect(response.status).toBe(401);
  });

  it("crea un bloque horario", async () => {
    const app = createApp({ scheduleConfigService: buildScheduleConfigServiceMock() as any });
    const response = await request(app)
      .post("/api/v1/schedule-config/time-blocks")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        grupoId: "group-1",
        nombre: "Bloque 1",
        horaInicio: "07:00",
        horaFin: "08:30",
        orden: 1,
        activo: true
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.item.duracionMinutos).toBe(90);
  });
});
