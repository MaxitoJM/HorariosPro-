import { z } from "zod";
import { ROLE_VALUES } from "../../constants/roles.js";
const passwordSchema = z
    .string()
    .min(8)
    .max(64)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/, {
    message: "La contrasena no cumple las reglas de seguridad"
});
export const registerSchema = z.object({
    body: z.object({
        nombre: z.string().trim().min(2).max(80),
        apellido: z.string().trim().min(2).max(80),
        email: z.string().trim().email().toLowerCase(),
        password: passwordSchema,
        rol: z.enum(ROLE_VALUES).optional()
    }),
    query: z.object({}).default({}),
    params: z.object({}).default({})
});
export const loginSchema = z.object({
    body: z.object({
        email: z.string().trim().email().toLowerCase(),
        password: z.string().min(1)
    }),
    query: z.object({}).default({}),
    params: z.object({}).default({})
});
export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(10).optional()
    }),
    query: z.object({}).default({}),
    params: z.object({}).default({})
});
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().trim().email().toLowerCase()
    }),
    query: z.object({}).default({}),
    params: z.object({}).default({})
});
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(10),
        password: passwordSchema
    }),
    query: z.object({}).default({}),
    params: z.object({}).default({})
});
