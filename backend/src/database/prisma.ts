import { PrismaClient } from "@prisma/client";
import { softDeleteExtension } from "./soft-delete.extension.js";

// Cliente base sin extensiones. Exportado para tests o casos admin que
// necesiten bypass total del filtrado automático.
export const basePrisma = new PrismaClient();

// Cliente extendido con soft-delete automático. Es el que usan todos los
// services de la app. El cast `as unknown as PrismaClient` preserva
// compatibilidad de tipos con los services existentes — la API pública
// (findMany, create, $transaction, etc.) es idéntica.
export const prisma = basePrisma.$extends(softDeleteExtension) as unknown as PrismaClient;
