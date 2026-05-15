import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/, {
    message: "La contrasena no cumple las reglas de seguridad"
  });

export const listStudentsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    search: z.string().trim().optional(),
    includeInactive: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value ? value === "true" : undefined))
  }),
  params: z.object({}).default({})
});

export const createStudentSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2).max(80),
    apellido: z.string().trim().min(2).max(80),
    email: z.string().trim().email().toLowerCase(),
    password: passwordSchema,
    activo: z.boolean().default(true),
    verificado: z.boolean().default(false)
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({})
});

export const studentParamsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({ id: z.string().min(1) })
});
