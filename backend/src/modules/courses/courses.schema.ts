import { z } from "zod";

const emptyBody = z.object({}).default({});
const emptyQuery = z.object({}).default({});
const idParams = z.object({ id: z.string().min(1) });
const sectionParams = z.object({ id: z.string().min(1), sectionId: z.string().min(1) });

const optionalString = z.string().trim().optional().or(z.literal(""));

export const listCoursesSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({}).default({})
});

export const courseParamsSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

export const createCourseSchema = z.object({
  body: z.object({
    codigo: z.string().trim().min(3).max(20).toUpperCase(),
    nombre: z.string().trim().min(2).max(120),
    departamento: z.string().trim().min(2).max(80),
    creditos: z.coerce.number().int().positive().max(12),
    sesionesPorSemana: z.coerce.number().int().positive().max(7),
    duracionMinutos: z.coerce.number().int().positive().max(360),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updateCourseSchema = z.object({
  body: z.object({
    codigo: z.string().trim().min(3).max(20).toUpperCase(),
    nombre: z.string().trim().min(2).max(120),
    departamento: z.string().trim().min(2).max(80),
    creditos: z.coerce.number().int().positive().max(12),
    sesionesPorSemana: z.coerce.number().int().positive().max(7),
    duracionMinutos: z.coerce.number().int().positive().max(360),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: idParams
});

export const deleteCourseSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

export const createSectionSchema = z.object({
  body: z.object({
    codigoSeccion: z.string().trim().min(1).max(20).toUpperCase(),
    teacherId: optionalString,
    classroomId: optionalString,
    capacidad: z.coerce.number().int().positive().max(300),
    inscritos: z.coerce.number().int().min(0).max(300).default(0),
    horarioResumen: optionalString,
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: idParams
});

export const updateSectionSchema = z.object({
  body: z.object({
    codigoSeccion: z.string().trim().min(1).max(20).toUpperCase(),
    teacherId: optionalString,
    classroomId: optionalString,
    capacidad: z.coerce.number().int().positive().max(300),
    inscritos: z.coerce.number().int().min(0).max(300),
    horarioResumen: optionalString,
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: sectionParams
});

export const deleteSectionSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: sectionParams
});
