import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { scheduleExportSchema, scheduleReportSchema } from "./reports.schema.js";
import { ReportsService } from "./reports.service.js";

type ReportsServiceLike = Pick<
  ReportsService,
  "getScheduleReport" | "exportScheduleCsv"
>;

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
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${data.filename}"`);
      return res.status(200).send(data.content);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
