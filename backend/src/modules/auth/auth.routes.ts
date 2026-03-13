import { Router } from "express";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authRateLimiter, loginRateLimiter } from "../../middlewares/rate-limit.js";
import { validate } from "../../middlewares/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema
} from "./auth.schema.js";
import { AuthService } from "./auth.service.js";

const COOKIE_NAME = "nucleo_rt";

type AuthServiceLike = Pick<
  AuthService,
  "register" | "login" | "refresh" | "logout" | "logoutAll" | "forgotPassword" | "resetPassword" | "me"
>;

function getRequestMeta(req: any) {
  return {
    userAgent: req.get("user-agent") ?? "unknown",
    ipAddress: req.ip
  };
}

function setRefreshCookie(res: any, token: string, expiresAt: Date) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    expires: expiresAt
  });
}

function clearRefreshCookie(res: any) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax"
  });
}

export function authRouter(service?: AuthServiceLike) {
  const router = Router();
  const authService = service ?? new AuthService(prisma);

  router.post("/register", authRateLimiter, validate(registerSchema), async (req, res, next) => {
    try {
      const result = await authService.register(req.body, getRequestMeta(req));
      setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
      return res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/login", loginRateLimiter, validate(loginSchema), async (req, res, next) => {
    try {
      const result = await authService.login(req.body, getRequestMeta(req));
      setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/refresh", authRateLimiter, validate(refreshSchema), async (req, res, next) => {
    try {
      const incomingRefreshToken = req.cookies[COOKIE_NAME] ?? req.body.refreshToken;
      if (!incomingRefreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: "MISSING_REFRESH_TOKEN",
            message: "Refresh token requerido"
          }
        });
      }

      const result = await authService.refresh(incomingRefreshToken, getRequestMeta(req));
      setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/logout", authRateLimiter, async (req, res, next) => {
    try {
      const incomingRefreshToken = req.cookies[COOKIE_NAME] ?? req.body?.refreshToken;
      await authService.logout(incomingRefreshToken);
      clearRefreshCookie(res);
      return res.status(200).json({ success: true, data: { message: "Sesión cerrada" } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/logout-all", authenticate, authRateLimiter, async (req: any, res, next) => {
    try {
      await authService.logoutAll(req.user.id, getRequestMeta(req));
      clearRefreshCookie(res);
      return res.status(200).json({ success: true, data: { message: "Todas las sesiones fueron cerradas" } });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
    try {
      const result = await authService.forgotPassword(req.body.email, getRequestMeta(req));
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), async (req, res, next) => {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password, getRequestMeta(req));
      clearRefreshCookie(res);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/me", authenticate, async (req: any, res, next) => {
    try {
      const user = await authService.me(req.user.id);
      return res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
