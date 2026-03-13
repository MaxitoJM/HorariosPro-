import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    rol: "admin" | "profesor" | "estudiante";
  };
};

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return next(new HttpError(401, "No autenticado", "UNAUTHENTICATED"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol
    };
    return next();
  } catch {
    return next(new HttpError(401, "Token inválido o expirado", "INVALID_TOKEN"));
  }
}
