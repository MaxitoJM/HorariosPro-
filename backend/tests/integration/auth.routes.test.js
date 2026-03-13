import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
function buildAuthServiceMock() {
    return {
        register: vi.fn().mockResolvedValue({
            user: {
                id: "u1",
                nombre: "Ana",
                apellido: "Pérez",
                email: "ana@test.com",
                rol: "estudiante",
                activo: true,
                verificado: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            accessToken: "access-token",
            refreshToken: "refresh-token",
            refreshTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60)
        }),
        login: vi.fn().mockResolvedValue({
            user: {
                id: "u1",
                nombre: "Ana",
                apellido: "Pérez",
                email: "ana@test.com",
                rol: "estudiante",
                activo: true,
                verificado: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            accessToken: "access-token",
            refreshToken: "refresh-token",
            refreshTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60)
        }),
        refresh: vi.fn().mockResolvedValue({
            user: {
                id: "u1",
                nombre: "Ana",
                apellido: "Pérez",
                email: "ana@test.com",
                rol: "estudiante",
                activo: true,
                verificado: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            accessToken: "access-token-new",
            refreshToken: "refresh-token-new",
            refreshTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60)
        }),
        logout: vi.fn().mockResolvedValue(undefined),
        logoutAll: vi.fn().mockResolvedValue(undefined),
        forgotPassword: vi.fn().mockResolvedValue({
            message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña"
        }),
        resetPassword: vi.fn().mockResolvedValue({
            message: "Contraseña actualizada correctamente"
        }),
        me: vi.fn().mockResolvedValue({
            id: "u1",
            nombre: "Ana",
            apellido: "Pérez",
            email: "ana@test.com",
            rol: "estudiante",
            activo: true,
            verificado: false,
            createdAt: new Date(),
            updatedAt: new Date()
        })
    };
}
describe("auth integration", () => {
    it("register responde 201", async () => {
        const app = createApp({ authService: buildAuthServiceMock() });
        const response = await request(app).post("/api/v1/auth/register").send({
            nombre: "Ana",
            apellido: "Pérez",
            email: "ana@test.com",
            password: "Admin12345*",
            rol: "estudiante"
        });
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe("ana@test.com");
    });
    it("login responde 200", async () => {
        const app = createApp({ authService: buildAuthServiceMock() });
        const response = await request(app).post("/api/v1/auth/login").send({
            email: "ana@test.com",
            password: "Admin12345*"
        });
        expect(response.status).toBe(200);
        expect(response.body.data.accessToken).toBeDefined();
    });
    it("forgot-password responde 200 y no filtra existencia", async () => {
        const app = createApp({ authService: buildAuthServiceMock() });
        const response = await request(app).post("/api/v1/auth/forgot-password").send({
            email: "no-importa@test.com"
        });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain("Si el email existe");
    });
});
