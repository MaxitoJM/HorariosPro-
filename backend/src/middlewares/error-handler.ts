import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Recurso no encontrado"
    }
  });
}

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = typeof error?.statusCode === "number" ? error.statusCode : 500;
  const code = error?.code ?? "INTERNAL_ERROR";

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: statusCode >= 500 ? "Error interno del servidor" : error?.message ?? "Error desconocido",
      ...(error?.details ? { details: error.details } : {})
    }
  });
}
