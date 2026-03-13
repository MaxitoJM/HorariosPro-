import { HttpError } from "../utils/http-error.js";
export function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new HttpError(401, "No autenticado", "UNAUTHENTICATED"));
        }
        if (!roles.includes(req.user.rol)) {
            return next(new HttpError(403, "No autorizado", "FORBIDDEN"));
        }
        return next();
    };
}
