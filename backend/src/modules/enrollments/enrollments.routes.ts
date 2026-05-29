import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  enrollSchema,
  enrollmentParamsSchema,
  listEnrollmentsSchema,
  setEnrollmentStatusSchema
} from "./enrollments.schema.js";
import { EnrollmentsService } from "./enrollments.service.js";

type ServiceLike = Pick<
  EnrollmentsService,
  "listEnrollments" | "getEnrollmentById" | "enroll" | "withdraw" | "setStatus"
>;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function enrollmentsRouter(service?: ServiceLike) {
  const router = Router();
  const svc = service ?? new EnrollmentsService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listEnrollmentsSchema), async (req, res, next) => {
    try {
      const items = await svc.listEnrollments(req.query as any);
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(enrollmentParamsSchema), async (req, res, next) => {
    try {
      const item = await svc.getEnrollmentById(String(req.params.id));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", validate(enrollSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.enroll(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/:id/status", validate(setEnrollmentStatusSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.setStatus(String(req.params.id), req.body.estado, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", validate(enrollmentParamsSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await svc.withdraw(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Inscripcion retirada correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
