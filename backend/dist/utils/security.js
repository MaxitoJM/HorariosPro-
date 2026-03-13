import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "../config/env.js";
const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/;
export async function hashPassword(password) {
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function validatePasswordStrength(password) {
    return PASSWORD_RULES.test(password);
}
export function generateOpaqueToken(size = 48) {
    return crypto.randomBytes(size).toString("base64url");
}
export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
