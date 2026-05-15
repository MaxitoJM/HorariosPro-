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
