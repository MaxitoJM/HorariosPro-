import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { DashboardService } from "./dashboard.service.js";

type DashboardServiceLike = Pick<DashboardService, "getSummary">;

export function dashboardRouter(service?: DashboardServiceLike) {
  const router = Router();
  const dashboardService = service ?? new DashboardService(prisma);

  router.use(authenticate);

  router.get("/summary", async (_req, res, next) => {
    try {
      const data = await dashboardService.getSummary();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
