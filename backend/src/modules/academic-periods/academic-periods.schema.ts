import { z } from "zod";

const idParams = z.object({ id: z.string().min(1) });
const emptyBody = z.object({}).default({});
const emptyQuery = z.object({}).default({});
const booleanQuery = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => (v ? v === "true" : undefined));

export const listPeriodsSchema = z.object({
  body: emptyBody,
  query: z.object({ deleted: booleanQuery }),
  params: z.object({}).default({})
});

export const periodParamsSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

const periodBody = z.object({
  codigo: z.string().trim().min(1).max(20),
  nombre: z.string().trim().min(2).max(120),
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime(),
  esActual: z.boolean().optional(),
  activo: z.boolean().optional()
});

export const createPeriodSchema = z.object({
  body: periodBody,
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updatePeriodSchema = z.object({
  body: periodBody,
  query: emptyQuery,
  params: idParams
});

export const restorePeriodSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

export const setCurrentPeriodSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});
