import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  createPeriodSchema,
  listPeriodsSchema,
  periodParamsSchema,
  restorePeriodSchema,
  setCurrentPeriodSchema,
  updatePeriodSchema
} from "./academic-periods.schema.js";
import { AcademicPeriodsService } from "./academic-periods.service.js";

type ServiceLike = Pick<
  AcademicPeriodsService,
  "listPeriods" | "getPeriodById" | "createPeriod" | "updatePeriod" | "deletePeriod" | "restorePeriod" | "setCurrentPeriod"
>;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function academicPeriodsRouter(service?: ServiceLike) {
  const router = Router();
  const svc = service ?? new AcademicPeriodsService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listPeriodsSchema), async (req, res, next) => {
    try {
      const items = await svc.listPeriods(req.query as any);
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(periodParamsSchema), async (req, res, next) => {
    try {
      const item = await svc.getPeriodById(String(req.params.id));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", validate(createPeriodSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.createPeriod(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", validate(updatePeriodSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.updatePeriod(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", validate(periodParamsSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await svc.deletePeriod(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Periodo eliminado correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:id/restore", validate(restorePeriodSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.restorePeriod(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:id/set-current", validate(setCurrentPeriodSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.setCurrentPeriod(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
