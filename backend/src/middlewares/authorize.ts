import type { Response, NextFunction } from "express";
import type { Role } from "../constants/roles.js";
import { HttpError } from "../utils/http-error.js";
import type { AuthenticatedRequest } from "./authenticate.js";

export function authorize(...roles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "No autenticado", "UNAUTHENTICATED"));
    }

    if (!roles.includes(req.user.rol)) {
      return next(new HttpError(403, "No autorizado", "FORBIDDEN"));
    }

    return next();
  };
}
