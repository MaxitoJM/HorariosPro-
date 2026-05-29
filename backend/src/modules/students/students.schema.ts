import { z } from "zod";

const idParams = z.object({ id: z.string().min(1) });
const emptyBody = z.object({}).default({});
const emptyQuery = z.object({}).default({});
const booleanQuery = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => (v ? v === "true" : undefined));

const studentStatus = z.enum(["activo", "egresado", "retirado", "suspendido"]);
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const listStudentsSchema = z.object({
  body: emptyBody,
  query: z.object({
    search: z.string().trim().optional(),
    programId: z.string().optional(),
    estado: studentStatus.optional(),
    deleted: booleanQuery,
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(200).optional()
  }),
  params: z.object({}).default({})
});

export const studentParamsSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

const studentBody = z.object({
  codigo: z.string().trim().min(1).max(30),
  nombre: z.string().trim().min(2).max(80),
  apellido: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  userId: optionalString,
  programId: optionalString,
  estado: studentStatus.optional()
});

export const createStudentSchema = z.object({
  body: studentBody,
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updateStudentSchema = z.object({
  body: studentBody,
  query: emptyQuery,
  params: idParams
});

export const restoreStudentSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});
