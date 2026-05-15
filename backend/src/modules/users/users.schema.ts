import { z } from "zod";
import { ROLE_VALUES } from "../../constants/roles.js";

const passwordSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/, {
    message: "La contrasena no cumple las reglas de seguridad"
  });

const booleanQuery = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => (value ? value === "true" : undefined));

export const listUsersSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    rol: z.enum(ROLE_VALUES).optional(),
    search: z.string().trim().optional(),
    includeInactive: booleanQuery
  }),
  params: z.object({}).default({})
});

export const updateUserSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2).max(80),
    apellido: z.string().trim().min(2).max(80),
    email: z.string().trim().email().toLowerCase(),
    rol: z.enum(ROLE_VALUES),
    activo: z.boolean().default(true),
    verificado: z.boolean().default(false),
    password: passwordSchema.optional()
  }),
  query: z.object({}).default({}),
  params: z.object({ id: z.string().min(1) })
});

export const deleteUserSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({ id: z.string().min(1) })
});
