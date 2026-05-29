import { z } from "zod";

const idParams = z.object({ id: z.string().min(1) });
const emptyBody = z.object({}).default({});
const emptyQuery = z.object({}).default({});
const booleanQuery = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => (v ? v === "true" : undefined));

export const listProgramsSchema = z.object({
  body: emptyBody,
  query: z.object({ deleted: booleanQuery, search: z.string().trim().optional() }),
  params: z.object({}).default({})
});

export const programParamsSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

const programBody = z.object({
  codigo: z.string().trim().min(1).max(20),
  nombre: z.string().trim().min(2).max(120),
  departamento: z.string().trim().min(2).max(120),
  activo: z.boolean().optional()
});

export const createProgramSchema = z.object({
  body: programBody,
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updateProgramSchema = z.object({
  body: programBody,
  query: emptyQuery,
  params: idParams
});

export const restoreProgramSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});
