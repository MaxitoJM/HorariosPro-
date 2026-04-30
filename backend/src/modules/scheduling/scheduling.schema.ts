import { z } from "zod";

const weekDayValues = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;
const viewValues = ["all", "teacher", "classroom", "course"] as const;
const emptyBody = z.object({}).default({});

export const getManualContextSchema = z.object({
  body: emptyBody,
  query: z.object({}).default({}),
  params: z.object({ sectionId: z.string().min(1) })
});

export const saveManualAssignmentSchema = z.object({
  body: z.object({
    classroomId: z.string().min(1),
    meetings: z
      .array(
        z.object({
          diaSemana: z.enum(weekDayValues),
          timeBlockId: z.string().min(1)
        })
      )
      .min(1)
  }),
  query: z.object({}).default({}),
  params: z.object({ sectionId: z.string().min(1) })
});

export const getOverviewSchema = z.object({
  body: emptyBody,
  query: z.object({
    view: z.enum(viewValues).default("all"),
    entityId: z.string().optional()
  }),
  params: z.object({}).default({})
});

export const detectConflictsSchema = z.object({
  body: emptyBody,
  query: z.object({}).default({}),
  params: z.object({}).default({})
});

export const autoGenerateSchema = z.object({
  body: z
    .object({
      sectionIds: z.array(z.string().min(1)).optional()
    })
    .default({}),
  query: z.object({}).default({}),
  params: z.object({}).default({})
});

export const reassignSectionSchema = z.object({
  body: emptyBody,
  query: z.object({}).default({}),
  params: z.object({ sectionId: z.string().min(1) })
});

