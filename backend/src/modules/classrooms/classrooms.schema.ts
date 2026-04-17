import { z } from "zod";

const weekDayValues = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;
const classroomTypes = ["aula", "laboratorio", "auditorio", "sala_computo", "otro"] as const;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const emptyBody = z.object({}).default({});
const emptyQuery = z.object({}).default({});
const idParams = z.object({ id: z.string().min(1) });

export const listClassroomsSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({}).default({})
});

export const classroomParamsSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

export const createClassroomSchema = z.object({
  body: z.object({
    codigo: z.string().trim().min(2).max(30).toUpperCase(),
    edificio: z.string().trim().min(2).max(80),
    piso: z.string().trim().max(30).optional().or(z.literal("")),
    tipo: z.enum(classroomTypes),
    capacidad: z.coerce.number().int().positive().max(500),
    equipamiento: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updateClassroomSchema = z.object({
  body: z.object({
    codigo: z.string().trim().min(2).max(30).toUpperCase(),
    edificio: z.string().trim().min(2).max(80),
    piso: z.string().trim().max(30).optional().or(z.literal("")),
    tipo: z.enum(classroomTypes),
    capacidad: z.coerce.number().int().positive().max(500),
    equipamiento: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: idParams
});

export const deleteClassroomSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

export const updateClassroomAvailabilitySchema = z.object({
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
