import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { createEnrollmentSchema, deleteEnrollmentSchema, enrollmentContextSchema } from "./enrollments.schema.js";
import { EnrollmentsService } from "./enrollments.service.js";

type EnrollmentsServiceLike = Pick<EnrollmentsService, "getEnrollmentContext" | "enroll" | "withdraw">;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function enrollmentsRouter(service?: EnrollmentsServiceLike) {
  const router = Router();
  const enrollmentsService = service ?? new EnrollmentsService(prisma);

  router.use(authenticate, authorize("estudiante"));

  router.get("/me", validate(enrollmentContextSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const data = await enrollmentsService.getEnrollmentContext(String(req.user!.id));
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/me", validate(createEnrollmentSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const data = await enrollmentsService.enroll(String(req.user!.id), req.body.sectionId, getRequestMeta(req));
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/me/:enrollmentId", validate(deleteEnrollmentSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const data = await enrollmentsService.withdraw(String(req.user!.id), String(req.params.enrollmentId), getRequestMeta(req));
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
