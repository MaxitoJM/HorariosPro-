import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/utils/jwt.js";

function adminToken() {
  return signAccessToken({ sub: "admin-1", email: "admin@test.com", rol: "admin" });
}

function buildUsersServiceMock() {
  return {
    listUsers: vi.fn().mockResolvedValue([
      {
        id: "user-1",
        nombre: "Ana",
        apellido: "Admin",
        email: "ana@test.com",
        rol: "admin",
        activo: true,
        verificado: true
      }
    ]),
    updateUser: vi.fn().mockResolvedValue({
      id: "user-2",
      nombre: "Luis",
      apellido: "Lopez",
      email: "luis@test.com",
      rol: "profesor",
      activo: true,
      verificado: true
    }),
    deleteUser: vi.fn().mockResolvedValue(undefined)
  };
}

describe("users integration", () => {
  it("lista usuarios", async () => {
    const usersService = buildUsersServiceMock();
    const app = createApp({ usersService: usersService as any });

    const response = await request(app)
      .get("/api/v1/users?includeInactive=true")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].email).toBe("ana@test.com");
    expect(usersService.listUsers).toHaveBeenCalledWith(expect.objectContaining({ includeInactive: true }));
  });

  it("edita usuario", async () => {
    const app = createApp({ usersService: buildUsersServiceMock() as any });

    const response = await request(app)
      .put("/api/v1/users/user-2")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        nombre: "Luis",
        apellido: "Lopez",
        email: "luis@test.com",
        rol: "profesor",
        activo: true,
        verificado: true
      });

    expect(response.status).toBe(200);
    expect(response.body.data.item.rol).toBe("profesor");
  });

  it("elimina usuario", async () => {
    const app = createApp({ usersService: buildUsersServiceMock() as any });

    const response = await request(app)
      .delete("/api/v1/users/user-2")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe("Usuario eliminado correctamente");
  });
});
