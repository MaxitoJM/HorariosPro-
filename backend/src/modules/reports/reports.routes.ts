import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  courseDemandReportSchema,
  enrollmentsReportSchema,
  occupancyReportSchema,
  scheduleExportSchema,
  scheduleReportSchema
} from "./reports.schema.js";
import { ReportsService } from "./reports.service.js";

type ReportsServiceLike = Pick<
  ReportsService,
  | "getScheduleReport"
  | "exportScheduleCsv"
  | "getEnrollmentsReport"
  | "exportEnrollmentsCsv"
  | "getCourseDemandReport"
  | "exportCourseDemandCsv"
  | "getClassroomOccupancyReport"
  | "exportClassroomOccupancyCsv"
>;

function sendCsv(res: any, data: { filename: string; content: string }) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${data.filename}"`);
  return res.status(200).send(data.content);
}

export function reportsRouter(service?: ReportsServiceLike) {
  const router = Router();
  const reportsService = service ?? new ReportsService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/schedule", validate(scheduleReportSchema), async (req, res, next) => {
    try {
      const data = await reportsService.getScheduleReport(req.query as any);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/schedule/export", validate(scheduleExportSchema), async (req, res, next) => {
    try {
      const data = await reportsService.exportScheduleCsv(req.query as any);
      return sendCsv(res, data);
    } catch (error) {
      return next(error);
    }
  });

  // Estudiantes inscritos por curso/seccion (?format=csv para exportar)
  router.get("/enrollments", validate(enrollmentsReportSchema), async (req, res, next) => {
    try {
      const q = req.query as any;
      if (q.format === "csv") return sendCsv(res, await reportsService.exportEnrollmentsCsv(q));
      return res.status(200).json({ success: true, data: await reportsService.getEnrollmentsReport(q) });
    } catch (error) {
      return next(error);
    }
  });

  // Demanda de cursos (inscritos por curso, ordenado)
  router.get("/course-demand", validate(courseDemandReportSchema), async (req, res, next) => {
    try {
      const q = req.query as any;
      if (q.format === "csv") return sendCsv(res, await reportsService.exportCourseDemandCsv(q));
      return res.status(200).json({ success: true, data: await reportsService.getCourseDemandReport(q) });
    } catch (error) {
      return next(error);
    }
  });

  // Ocupacion de aulas
  router.get("/classroom-occupancy", validate(occupancyReportSchema), async (req, res, next) => {
    try {
      const q = req.query as any;
      if (q.format === "csv") return sendCsv(res, await reportsService.exportClassroomOccupancyCsv());
      return res.status(200).json({ success: true, data: await reportsService.getClassroomOccupancyReport() });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
