import { z } from "zod";

const viewValues = ["all", "teacher", "classroom", "course"] as const;
const booleanQuery = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const scheduleQuery = z.object({
  view: z.enum(viewValues).default("all"),
  entityId: z.string().optional(),
  department: z.string().optional(),
  includeUnscheduled: booleanQuery
});

export const scheduleReportSchema = z.object({
  body: z.object({}).default({}),
  query: scheduleQuery,
  params: z.object({}).default({})
});

export const scheduleExportSchema = z.object({
  body: z.object({}).default({}),
  query: scheduleQuery.extend({
    format: z.enum(["csv"]).default("csv")
  }),
  params: z.object({}).default({})
});

const formatQuery = z.enum(["csv"]).optional();

export const enrollmentsReportSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    periodoId: z.string().optional(),
    courseId: z.string().optional(),
    programId: z.string().optional(),
    format: formatQuery
  }),
  params: z.object({}).default({})
});

export const courseDemandReportSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    periodoId: z.string().optional(),
    format: formatQuery
  }),
  params: z.object({}).default({})
});

export const occupancyReportSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({ format: formatQuery }),
  params: z.object({}).default({})
});
