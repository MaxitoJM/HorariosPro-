import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function buildCoursesServiceMock() {
  return {
    listCourses: vi.fn().mockResolvedValue([
      {
        id: "course-1",
        codigo: "MAT-101",
        nombre: "Calculo I",
        departamento: "Matematicas",
        creditos: 4,
        sesionesPorSemana: 3,
        duracionMinutos: 90,
        activo: true,
        sections: [],
        totalSecciones: 0,
        totalInscritos: 0
      }
    ]),
    getCourseById: vi.fn().mockResolvedValue({
      id: "course-1",
      codigo: "MAT-101",
      nombre: "Calculo I",
      departamento: "Matematicas",
      creditos: 4,
      sesionesPorSemana: 3,
      duracionMinutos: 90,
      activo: true,
      sections: [],
      totalSecciones: 0,
      totalInscritos: 0
    }),
    createCourse: vi.fn().mockResolvedValue({
      id: "course-1",
      codigo: "MAT-101",
      nombre: "Calculo I",
      departamento: "Matematicas",
      creditos: 4,
      sesionesPorSemana: 3,
      duracionMinutos: 90,
      activo: true,
      sections: [],
      totalSecciones: 0,
      totalInscritos: 0
    }),
    updateCourse: vi.fn().mockResolvedValue({
      id: "course-1",
      codigo: "MAT-101",
      nombre: "Calculo I",
      departamento: "Matematicas",
      creditos: 4,
      sesionesPorSemana: 3,
      duracionMinutos: 90,
      activo: true,
      sections: [],
      totalSecciones: 0,
      totalInscritos: 0
    }),
    deleteCourse: vi.fn().mockResolvedValue(undefined),
    createSection: vi.fn().mockResolvedValue({
      id: "section-1",
      codigoSeccion: "A",
      teacherId: "teacher-1",
      classroomId: "classroom-1",
      capacidad: 30,
      inscritos: 20,
      horarioResumen: "Lun-Mie 07:00-08:30",
      activo: true,
      teacherNombre: "Juan Perez",
      classroomNombre: "A-301 - Edificio A"
    }),
    updateSection: vi.fn().mockResolvedValue({
      id: "section-1",
      codigoSeccion: "A",
      teacherId: "teacher-1",
      classroomId: "classroom-1",
      capacidad: 30,
      inscritos: 22,
      horarioResumen: "Lun-Mie 07:00-08:30",
      activo: true,
      teacherNombre: "Juan Perez",
      classroomNombre: "A-301 - Edificio A"
    }),
    deleteSection: vi.fn().mockResolvedValue(undefined)
  };
}

function adminToken() {
  return signAccessToken({
    sub: "admin-1",
    email: "admin@test.com",
    rol: "admin"
  });
}

describe("courses integration", () => {
  it("lista cursos autenticado como admin", async () => {
    const app = createApp({ coursesService: buildCoursesServiceMock() as any });
    const response = await request(app).get("/api/v1/courses").set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
  });

  it("crea curso", async () => {
    const app = createApp({ coursesService: buildCoursesServiceMock() as any });
    const response = await request(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        codigo: "MAT-101",
        nombre: "Calculo I",
        departamento: "Matematicas",
        creditos: 4,
        sesionesPorSemana: 3,
        duracionMinutos: 90,
        activo: true
      });

    expect(response.status).toBe(201);
    expect(response.body.data.item.codigo).toBe("MAT-101");
  });

  it("crea seccion de un curso", async () => {
    const app = createApp({ coursesService: buildCoursesServiceMock() as any });
    const response = await request(app)
      .post("/api/v1/courses/course-1/sections")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        codigoSeccion: "A",
        teacherId: "teacher-1",
        classroomId: "classroom-1",
        capacidad: 30,
        inscritos: 20,
        horarioResumen: "Lun-Mie 07:00-08:30",
        activo: true
      });

    expect(response.status).toBe(201);
    expect(response.body.data.item.codigoSeccion).toBe("A");
  });
});
