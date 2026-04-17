import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { SchedulingService } from "./scheduling.service.js";
import { getManualContextSchema, getOverviewSchema, saveManualAssignmentSchema } from "./scheduling.schema.js";

type SchedulingServiceLike = Pick<SchedulingService, "getManualContext" | "saveManualAssignment" | "getOverview">;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function schedulingRouter(service?: SchedulingServiceLike) {
  const router = Router();
  const schedulingService = service ?? new SchedulingService(prisma);

  router.use(authenticate);

  router.get("/overview", validate(getOverviewSchema), async (req, res, next) => {
    try {
      const data = await schedulingService.getOverview(
        (req.query.view as "all" | "teacher" | "classroom" | "course") ?? "all",
        typeof req.query.entityId === "string" ? req.query.entityId : undefined
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/sections/:sectionId/manual-context", authorize("admin"), validate(getManualContextSchema), async (req, res, next) => {
    try {
      const data = await schedulingService.getManualContext(String(req.params.sectionId));
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  router.put(
    "/sections/:sectionId/manual-assignment",
    authorize("admin"),
    validate(saveManualAssignmentSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const data = await schedulingService.saveManualAssignment(String(req.params.sectionId), req.body, getRequestMeta(req));
        return res.status(200).json({ success: true, data });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
