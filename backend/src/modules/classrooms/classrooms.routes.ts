import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  classroomParamsSchema,
  createClassroomSchema,
  deleteClassroomSchema,
  listClassroomsSchema,
  restoreClassroomSchema,
  updateClassroomAvailabilitySchema,
  updateClassroomSchema
} from "./classrooms.schema.js";
import { ClassroomsService } from "./classrooms.service.js";

type ClassroomsServiceLike = Pick<
  ClassroomsService,
  | "listClassrooms"
  | "getClassroomById"
  | "createClassroom"
  | "updateClassroom"
  | "deleteClassroom"
  | "restoreClassroom"
  | "updateClassroomAvailability"
>;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function classroomsRouter(service?: ClassroomsServiceLike) {
  const router = Router();
  const classroomsService = service ?? new ClassroomsService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listClassroomsSchema), async (_req, res, next) => {
    try {
      const items = await classroomsService.listClassrooms();
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(classroomParamsSchema), async (req, res, next) => {
    try {
      const item = await classroomsService.getClassroomById(String(req.params.id));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", validate(createClassroomSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await classroomsService.createClassroom(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", validate(updateClassroomSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await classroomsService.updateClassroom(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", validate(deleteClassroomSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await classroomsService.deleteClassroom(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Aula eliminada correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:id/restore", validate(restoreClassroomSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await classroomsService.restoreClassroom(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id/availability", validate(updateClassroomAvailabilitySchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await classroomsService.updateClassroomAvailability(
        String(req.params.id),
        req.body.availability,
        getRequestMeta(req)
      );
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
