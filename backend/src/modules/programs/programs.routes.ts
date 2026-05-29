import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  createProgramSchema,
  listProgramsSchema,
  programParamsSchema,
  restoreProgramSchema,
  updateProgramSchema
} from "./programs.schema.js";
import { ProgramsService } from "./programs.service.js";

type ServiceLike = Pick<
  ProgramsService,
  "listPrograms" | "getProgramById" | "createProgram" | "updateProgram" | "deleteProgram" | "restoreProgram"
>;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function programsRouter(service?: ServiceLike) {
  const router = Router();
  const svc = service ?? new ProgramsService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listProgramsSchema), async (req, res, next) => {
    try {
      const items = await svc.listPrograms(req.query as any);
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(programParamsSchema), async (req, res, next) => {
    try {
      const item = await svc.getProgramById(String(req.params.id));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", validate(createProgramSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.createProgram(req.body, getRequestMeta(req));
      return res.status(201).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", validate(updateProgramSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.updateProgram(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", validate(programParamsSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await svc.deleteProgram(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Programa eliminado correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:id/restore", validate(restoreProgramSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await svc.restoreProgram(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
