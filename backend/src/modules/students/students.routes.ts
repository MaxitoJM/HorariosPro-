import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { createStudentSchema, listStudentsSchema, studentParamsSchema } from "./students.schema.js";
import { StudentsService } from "./students.service.js";

type StudentsServiceLike = Pick<StudentsService, "listStudents" | "getStudentById" | "createStudent">;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function studentsRouter(service?: StudentsServiceLike) {
  const router = Router();
  const studentsService = service ?? new StudentsService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listStudentsSchema), async (req, res, next) => {
    try {
      const items = await studentsService.listStudents(req.query as any);
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(studentParamsSchema), async (req, res, next) => {
    try {
      const item = await studentsService.getStudentById(String(req.params.id));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", validate(createStudentSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await studentsService.createStudent(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
