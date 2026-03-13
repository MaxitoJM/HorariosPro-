import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, validatePasswordStrength } from "../../src/utils/security.js";
describe("security utils", () => {
    it("debe validar reglas de contraseña", () => {
        expect(validatePasswordStrength("Admin12345*")).toBe(true);
        expect(validatePasswordStrength("123")).toBe(false);
    });
    it("debe hashear y comparar contraseña", async () => {
        const password = "Admin12345*";
        const hash = await hashPassword(password);
        expect(hash).not.toBe(password);
        expect(await comparePassword(password, hash)).toBe(true);
    });
});
