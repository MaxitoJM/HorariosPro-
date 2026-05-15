import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { authenticate, type AuthenticatedRequest } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { deleteUserSchema, listUsersSchema, updateUserSchema } from "./users.schema.js";
import { UsersService } from "./users.service.js";

type UsersServiceLike = Pick<UsersService, "listUsers" | "updateUser" | "deleteUser">;

function getRequestMeta(req: AuthenticatedRequest) {
  return {
    userId: req.user?.id ?? null,
    userAgent: req.get("user-agent") ?? "unknown",
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}

export function usersRouter(service?: UsersServiceLike) {
  const router = Router();
  const usersService = service ?? new UsersService(prisma);

  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listUsersSchema), async (req, res, next) => {
    try {
      const items = await usersService.listUsers(req.query as any);
      return res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", validate(updateUserSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      const item = await usersService.updateUser(String(req.params.id), req.body, getRequestMeta(req));
      return res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", validate(deleteUserSchema), async (req: AuthenticatedRequest, res, next) => {
    try {
      await usersService.deleteUser(String(req.params.id), getRequestMeta(req));
      return res.status(200).json({ success: true, data: { message: "Usuario eliminado correctamente" } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
