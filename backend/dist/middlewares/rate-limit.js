import rateLimit from "express-rate-limit";
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "RATE_LIMITED",
            message: "Demasiados intentos. Intenta más tarde."
        }
    }
});
export const loginRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "TOO_MANY_LOGIN_ATTEMPTS",
            message: "Demasiados intentos de login. Intenta en unos minutos."
        }
    }
});
