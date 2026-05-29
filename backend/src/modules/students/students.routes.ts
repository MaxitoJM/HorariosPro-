import { Router } from "express";
import multer from "multer";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { HttpError } from "../../utils/http-error.js";
import {
  createStudentSchema,
  listStudentsSchema,
  restoreStudentSchema,
  studentParamsSchema,
  updateStudentSchema
} from "./students.schema.js";
import { StudentsService } from "./students.service.js";

type ServiceLike = Pick<
  StudentsService,
  | "listStudents"
  | "getStudentById"
  | "createStudent"
  | "updateStudent"
  | "deleteStudent"
  | "restoreStudent"
  | "generateImportTemplate"
  | "previewImport"
  | "commitImport"
>;

// Upload en memoria, limite 2MB, solo .xlsx.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function studentsRouter(service?: ServiceLike) {
  const router = Router();
  const svc = service ?? new StudentsService(prisma);

  router.use(authenticate, authorize("admin"));

  // ── Importacion Excel ──────────────────────────────────────────────
  router.get("/import/template", async (_req, res, next) => {
    try {
      const buffer = await svc.generateImportTemplate();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="plantilla-estudiantes.xlsx"');
      return res.status(200).send(buffer);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/import/preview", upload.single("file"), async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) throw new HttpError(400, "Adjunte un archivo .xlsx en el campo 'file'", "FILE_REQUIRED");
      const result = await svc.previewImport(req.file.buffer);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/import/commit", upload.single("file"), async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) throw new HttpError(400, "Adjunte un archivo .xlsx en el campo 'file'", "FILE_REQUIRED");
      const result = await svc.commitImport(req.file.buffer, getRequestMeta(req));
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/", validate(listStudentsSchema), async (req, res, next) => {
    try {
      const result = await svc.listStudents(req.query as any);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(studentParamsSchema), async (req, res, next) => {
    try {
      const item = await svc.getStudentById(String(req.params.id));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", validate(createStudentSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.createStudent(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", validate(updateStudentSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.updateStudent(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", validate(studentParamsSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await svc.deleteStudent(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Estudiante eliminado correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:id/restore", validate(restoreStudentSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.restoreStudent(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
