import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";

// Soft-delete extension oficial de Prisma (no monkey-patch).
//
// Comportamiento:
//   - Para los 5 modelos listados abajo, las operaciones findMany/findFirst/count
//     reciben automáticamente `where: { deletedAt: null }` si el caller no lo
//     mencionó. Si el caller pasó `deletedAt` (incluyendo `undefined` explícito),
//     la extension NO altera el filtro.
//   - findUnique, aggregate, groupBy, updateMany, deleteMany NO se interceptan
//     intencionalmente (Bloque 1.3 minimiza superficie).
//   - Nested relations (include/select anidados) NO se filtran. Limitación
//     documentada de Prisma extensions. Resolveremos caso-por-caso en Bloque 1.4.
//
// Para BYPASS explícito en queries puntuales:
//   prisma.user.findMany({ where: { deletedAt: { not: null } } })       // solo borrados
//   prisma.user.findMany({ where: { deletedAt: undefined } })           // todos
//
// Para revertir la extension completa: en database/prisma.ts exportar
// `basePrisma` sin el `$extends`. Roll-back instantáneo, sin migración.

const SOFT_DELETE_MODELS = [
  "user",
  "teacher",
  "course",
  "classroom",
  "courseSection",
  "academicPeriod",
  "program",
  "student",
  "enrollment"
] as const;

type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

function injectDeletedAtFilter(args: any, model: SoftDeleteModel, operation: string) {
  const next = { ...(args ?? {}) };
  const currentWhere = next.where ?? {};

  // Respetar al caller: si mencionó deletedAt (cualquier valor, incluido undefined),
  // no tocar. Esto permite override explícito en endpoints de restore/admin.
  if ("deletedAt" in currentWhere) {
    return next;
  }

  next.where = { ...currentWhere, deletedAt: null };

  if (env.NODE_ENV === "development") {
    // Logging temporal — útil durante Bloque 1.3 para detectar efectos
    // colaterales en queries existentes. Quitar antes de Fase 2 si genera ruido.
    // eslint-disable-next-line no-console
    console.debug(`[soft-delete-ext] Injected deletedAt:null into ${model}.${operation}`);
  }

  return next;
}

export const softDeleteExtension = Prisma.defineExtension({
  name: "softDelete",
  query: {
    user: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "user", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "user", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "user", "count"));
      }
    },
    teacher: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "teacher", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "teacher", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "teacher", "count"));
      }
    },
    course: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "course", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "course", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "course", "count"));
      }
    },
    classroom: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "classroom", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "classroom", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "classroom", "count"));
      }
    },
    courseSection: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "courseSection", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "courseSection", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "courseSection", "count"));
      }
    },
    academicPeriod: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "academicPeriod", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "academicPeriod", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "academicPeriod", "count"));
      }
    },
    program: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "program", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "program", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "program", "count"));
      }
    },
    student: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "student", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "student", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "student", "count"));
      }
    },
    enrollment: {
      async findMany({ args, query }) {
        return query(injectDeletedAtFilter(args, "enrollment", "findMany"));
      },
      async findFirst({ args, query }) {
        return query(injectDeletedAtFilter(args, "enrollment", "findFirst"));
      },
      async count({ args, query }) {
        return query(injectDeletedAtFilter(args, "enrollment", "count"));
      }
    }
  }
});
