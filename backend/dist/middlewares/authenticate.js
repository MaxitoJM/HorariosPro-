import { HttpError } from "../utils/http-error.js";
import { verifyAccessToken } from "../utils/jwt.js";
export function authenticate(req, _res, next) {
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
    }
    catch {
        return next(new HttpError(401, "Token inválido o expirado", "INVALID_TOKEN"));
    }
}
