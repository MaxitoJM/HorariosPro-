import { z } from "zod";

const emptyBody = z.object({}).default({});
const emptyQuery = z.object({}).default({});

export const listEnrollmentsSchema = z.object({
  body: emptyBody,
  query: z.object({
    sectionId: z.string().optional(),
    studentId: z.string().optional(),
    periodoId: z.string().optional(),
    estado: z.enum(["inscrito", "retirado", "aprobado", "reprobado"]).optional()
  }),
  params: z.object({}).default({})
});

export const enrollSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    sectionId: z.string().min(1),
    periodoId: z.string().min(1).optional() // si se omite, usa el periodo actual
  }),
  query: emptyQuery,
  params: z.object({}).default({})
});

export const enrollmentParamsSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({ id: z.string().min(1) })
});

export const setEnrollmentStatusSchema = z.object({
  body: z.object({
    estado: z.enum(["inscrito", "retirado", "aprobado", "reprobado"])
  }),
  query: emptyQuery,
  params: z.object({ id: z.string().min(1) })
});
