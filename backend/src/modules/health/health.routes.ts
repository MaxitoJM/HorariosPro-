import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

export function healthRouter() {
  const router = Router();

  router.get("/public", (_req, res) => {
    return res.status(200).json({ success: true, data: { status: "ok" } });
  });

  router.get("/private", authenticate, (_req, res) => {
    return res.status(200).json({ success: true, data: { status: "authenticated" } });
  });

  router.get("/admin", authenticate, authorize("admin"), (_req, res) => {
    return res.status(200).json({ success: true, data: { status: "admin-only" } });
  });

  return router;
}
