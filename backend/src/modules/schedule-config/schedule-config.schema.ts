import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const allowedRuleKeys = [
  "EVITAR_DIAS_CONSECUTIVOS",
  "MAX_HORAS_DOCENTE",
  "DESCANSO_MINIMO_MINUTOS",
  "PERMITIR_GRUPOS_BAJO_CUPO",
  "VALIDAR_CONFLICTOS_AUTOMATICAMENTE"
] as const;
const ruleTypeValues = ["boolean", "number", "string", "json"] as const;
const workingDays = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"] as const;

const emptyBody = z.object({}).default({});
const emptyQuery = z.object({}).default({});
const idParams = z.object({ id: z.string().min(1) });

export const createTimeSlotGroupSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2).max(80),
    horaInicio: z.string().regex(timeRegex, "Hora de inicio invalida"),
    horaFin: z.string().regex(timeRegex, "Hora de fin invalida"),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updateTimeSlotGroupSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2).max(80),
    horaInicio: z.string().regex(timeRegex, "Hora de inicio invalida"),
    horaFin: z.string().regex(timeRegex, "Hora de fin invalida"),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: idParams
});

export const createTimeBlockSchema = z.object({
  body: z.object({
    grupoId: z.string().min(1),
    nombre: z.string().trim().min(2).max(80),
    horaInicio: z.string().regex(timeRegex, "Hora de inicio invalida"),
    horaFin: z.string().regex(timeRegex, "Hora de fin invalida"),
    orden: z.coerce.number().int().positive(),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updateTimeBlockSchema = z.object({
  body: z.object({
    grupoId: z.string().min(1),
    nombre: z.string().trim().min(2).max(80),
    horaInicio: z.string().regex(timeRegex, "Hora de inicio invalida"),
    horaFin: z.string().regex(timeRegex, "Hora de fin invalida"),
    orden: z.coerce.number().int().positive(),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: idParams
});

export const updateRulesSchema = z.object({
  body: z.object({
    rules: z
      .array(
        z.object({
          clave: z.enum(allowedRuleKeys),
          valor: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
          tipo: z.enum(ruleTypeValues),
          descripcion: z.string().trim().max(200).optional(),
          activo: z.boolean().optional()
        })
      )
      .min(1)
  }),
  query: emptyQuery,
  params: z.object({}).default({})
});

export const updateAcademicConfigSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2).max(100),
    sesionesPorSemanaDefault: z.coerce.number().int().positive(),
    duracionSesionDefault: z.coerce.number().int().positive(),
    diasHabiles: z.array(z.enum(workingDays)).min(1),
    activo: z.boolean().optional()
  }),
  query: emptyQuery,
  params: z.object({}).default({})
});

export const deleteByIdSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: idParams
});

export const listSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({}).default({})
});
