import { z } from "zod";

export const enrollmentContextSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({}).default({})
});

export const createEnrollmentSchema = z.object({
  body: z.object({
    sectionId: z.string().min(1)
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({})
});

export const deleteEnrollmentSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({ enrollmentId: z.string().min(1) })
});
