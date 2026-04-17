import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  createTimeBlockSchema,
  createTimeSlotGroupSchema,
  deleteByIdSchema,
  listSchema,
  updateAcademicConfigSchema,
  updateRulesSchema,
  updateTimeBlockSchema,
  updateTimeSlotGroupSchema
} from "./schedule-config.schema.js";
import { ScheduleConfigService } from "./schedule-config.service.js";

type ScheduleConfigServiceLike = Pick<
  ScheduleConfigService,
  | "listTimeSlotGroups"
  | "createTimeSlotGroup"
  | "updateTimeSlotGroup"
  | "deleteTimeSlotGroup"
  | "listTimeBlocks"
  | "createTimeBlock"
  | "updateTimeBlock"
  | "deleteTimeBlock"
  | "listRules"
  | "updateRules"
  | "getAcademicConfig"
  | "updateAcademicConfig"
>;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function scheduleConfigRouter(service?: ScheduleConfigServiceLike) {
  const router = Router();
  const scheduleConfigService = service ?? new ScheduleConfigService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/time-slot-groups", validate(listSchema), async (_req, res, next) => {
    try {
      const items = await scheduleConfigService.listTimeSlotGroups();
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/time-slot-groups", validate(createTimeSlotGroupSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await scheduleConfigService.createTimeSlotGroup(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/time-slot-groups/:id", validate(updateTimeSlotGroupSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await scheduleConfigService.updateTimeSlotGroup(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/time-slot-groups/:id", validate(deleteByIdSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await scheduleConfigService.deleteTimeSlotGroup(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Franja eliminada correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/time-blocks", validate(listSchema), async (_req, res, next) => {
    try {
      const items = await scheduleConfigService.listTimeBlocks();
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/time-blocks", validate(createTimeBlockSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await scheduleConfigService.createTimeBlock(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/time-blocks/:id", validate(updateTimeBlockSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await scheduleConfigService.updateTimeBlock(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/time-blocks/:id", validate(deleteByIdSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await scheduleConfigService.deleteTimeBlock(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Bloque eliminado correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/rules", validate(listSchema), async (_req, res, next) => {
    try {
      const items = await scheduleConfigService.listRules();
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/rules", validate(updateRulesSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const items = await scheduleConfigService.updateRules(req.body.rules, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/academic-config", validate(listSchema), async (_req, res, next) => {
    try {
      const item = await scheduleConfigService.getAcademicConfig();
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/academic-config", validate(updateAcademicConfigSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await scheduleConfigService.updateAcademicConfig(req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
