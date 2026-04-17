import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  courseParamsSchema,
  createCourseSchema,
  createSectionSchema,
  deleteCourseSchema,
  deleteSectionSchema,
  listCoursesSchema,
  updateCourseSchema,
  updateSectionSchema
} from "./courses.schema.js";
import { CoursesService } from "./courses.service.js";

type CoursesServiceLike = Pick<
  CoursesService,
  | "listCourses"
  | "getCourseById"
  | "createCourse"
  | "updateCourse"
  | "deleteCourse"
  | "createSection"
  | "updateSection"
  | "deleteSection"
>;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function coursesRouter(service?: CoursesServiceLike) {
  const router = Router();
  const coursesService = service ?? new CoursesService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listCoursesSchema), async (_req, res, next) => {
    try {
      const items = await coursesService.listCourses();
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(courseParamsSchema), async (req, res, next) => {
    try {
      const item = await coursesService.getCourseById(String(req.params.id));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", validate(createCourseSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await coursesService.createCourse(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", validate(updateCourseSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await coursesService.updateCourse(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", validate(deleteCourseSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await coursesService.deleteCourse(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Curso eliminado correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:id/sections", validate(createSectionSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await coursesService.createSection(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id/sections/:sectionId", validate(updateSectionSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await coursesService.updateSection(
        String(req.params.id),
        String(req.params.sectionId),
        req.body,
        getRequestMeta(req)
      );
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id/sections/:sectionId", validate(deleteSectionSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await coursesService.deleteSection(String(req.params.id), String(req.params.sectionId), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Seccion eliminada correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
