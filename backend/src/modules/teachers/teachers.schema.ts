import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const weekDayValues = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;

const emptyBody = z.object({}).default({});
const emptyQuery = z.object({}).default({});
const idParams = z.object({ id: z.string().min(1) });

export const createTeacherSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2).max(80),
    apellido: z.string().trim().min(2).max(80),
    email: z.string().trim().email().toLowerCase(),
    departamento: z.string().trim().min(2).max(80),
    titulo: z.string().trim().max(120).optional().or(z.literal("")),
    maxHorasSemana: z.coerce.number().int().positive().max(60),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updateTeacherSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2).max(80),
    apellido: z.string().trim().min(2).max(80),
    email: z.string().trim().email().toLowerCase(),
    departamento: z.string().trim().min(2).max(80),
    titulo: z.string().trim().max(120).optional().or(z.literal("")),
    maxHorasSemana: z.coerce.number().int().positive().max(60),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: idParams
});

export const updateTeacherAvailabilitySchema = z.object({
  body: z.object({
    availability: z.array(
      z.object({
        diaSemana: z.enum(weekDayValues),
        horaInicio: z.string().regex(timeRegex, "Hora de inicio invalida"),
        horaFin: z.string().regex(timeRegex, "Hora de fin invalida"),
        activo: z.boolean().optional()
      })
    )
  }),
  query: emptyQuery,
  params: idParams
});

export const updateTeacherAssignableCoursesSchema = z.object({
  body: z.object({
    courses: z.array(
      z.object({
        codigoCurso: z.string().trim().max(20).optional().or(z.literal("")),
        nombreCurso: z.string().trim().min(2).max(120),
        activo: z.boolean().optional()
      })
    )
  }),
  query: emptyQuery,
  params: idParams
});

export const deleteTeacherSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

export const listTeachersSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({}).default({})
});
