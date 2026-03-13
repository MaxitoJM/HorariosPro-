import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
describe("health integration", () => {
    it("public endpoint responde 200", async () => {
        const app = createApp();
        const response = await request(app).get("/api/v1/health/public");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
    it("private endpoint responde 401 sin token", async () => {
        const app = createApp();
        const response = await request(app).get("/api/v1/health/private");
        expect(response.status).toBe(401);
    });
});
