import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  createTeacherSchema,
  deleteTeacherSchema,
  listTeachersSchema,
  updateTeacherAssignableCoursesSchema,
  updateTeacherAvailabilitySchema,
  updateTeacherSchema
} from "./teachers.schema.js";
import { TeachersService } from "./teachers.service.js";

type TeachersServiceLike = Pick<
  TeachersService,
  | "listTeachers"
  | "getTeacherById"
  | "createTeacher"
  | "updateTeacher"
  | "deleteTeacher"
  | "updateTeacherAvailability"
  | "updateTeacherAssignableCourses"
>;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function teachersRouter(service?: TeachersServiceLike) {
  const router = Router();
  const teachersService = service ?? new TeachersService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listTeachersSchema), async (_req, res, next) => {
    try {
      const items = await teachersService.listTeachers();
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(deleteTeacherSchema), async (req, res, next) => {
    try {
      const item = await teachersService.getTeacherById(String(req.params.id));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", validate(createTeacherSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await teachersService.createTeacher(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", validate(updateTeacherSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await teachersService.updateTeacher(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", validate(deleteTeacherSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await teachersService.deleteTeacher(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Docente eliminado correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id/availability", validate(updateTeacherAvailabilitySchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await teachersService.updateTeacherAvailability(
        String(req.params.id),
        req.body.availability,
        getRequestMeta(req)
      );
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put(
    "/:id/assignable-courses",
    validate(updateTeacherAssignableCoursesSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const item = await teachersService.updateTeacherAssignableCourses(
          String(req.params.id),
          req.body.courses,
          getRequestMeta(req)
        );
        return res.status(200).json({ success: true, data: { item } });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
