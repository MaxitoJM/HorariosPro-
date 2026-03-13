import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z
        .string()
        .min(1)
        .default("postgresql://proyecto_nucleo_app:ProyectoNucleo2026*@localhost:5433/proyecto_nucleo?schema=public"),
    JWT_ACCESS_SECRET: z.string().min(16).default("dev_access_secret_change_in_production_123"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
    PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().positive().default(15),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    CORS_ORIGIN: z.string().default("http://localhost:5500"),
    COOKIE_SECURE: z
        .string()
        .transform((v) => v === "true")
        .default("false")
});
export const env = envSchema.parse(process.env);
