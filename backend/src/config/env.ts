import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const WEAK_DEFAULT_JWT = "dev_access_secret_change_in_production_123";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://proyecto_nucleo_app:ProyectoNucleo2026*@localhost:5433/proyecto_nucleo?schema=public"),
  JWT_ACCESS_SECRET: z.string().min(16).default(WEAK_DEFAULT_JWT),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().positive().default(15),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGIN: z.string().default("http://localhost:5500"),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax")
});

export const env = envSchema.parse(process.env);

// Guardas de producción: fallar temprano si la configuración es insegura.
if (env.NODE_ENV === "production") {
  if (env.JWT_ACCESS_SECRET === WEAK_DEFAULT_JWT) {
    throw new Error(
      "JWT_ACCESS_SECRET no puede usar el valor por defecto en producción. " +
        "Configura una variable de entorno con un secreto fuerte (>=32 chars aleatorios)."
    );
  }
  if (env.COOKIE_SAMESITE === "none" && !env.COOKIE_SECURE) {
    throw new Error(
      "COOKIE_SAMESITE=none requiere COOKIE_SECURE=true (HTTPS). Ajusta las variables en el hosting."
    );
  }
}
