import type { Role } from "../../constants/roles.js";
import { HttpError } from "../../utils/http-error.js";
import { hashPassword, validatePasswordStrength } from "../../utils/security.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type ListUsersFilters = {
  rol?: Role;
  search?: string;
  includeInactive?: boolean;
};

type UpdateUserInput = {
  nombre: string;
  apellido: string;
  email: string;
  rol: Role;
  activo: boolean;
  verificado: boolean;
  password?: string;
};

export class UsersService {
  constructor(private readonly prisma: any) {}

  async listUsers(filters: ListUsersFilters = {}) {
    const search = filters.search?.trim();
    const users = await this.prisma.user.findMany({
      where: {
        ...(filters.includeInactive ? {} : { activo: true }),
        ...(filters.rol ? { rol: filters.rol } : {}),
        ...(search
          ? {
              OR: [
                { nombre: { contains: search, mode: "insensitive" } },
                { apellido: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [{ rol: "asc" }, { apellido: "asc" }, { nombre: "asc" }]
    });

    return users.map((user: any) => this.toPublicUser(user));
  }

  async updateUser(id: string, input: UpdateUserInput, meta: RequestMeta) {
    const existing = await this.requireUser(id);
    await this.ensureUniqueEmail(input.email, id);

    if (meta.userId === id && (input.rol !== "admin" || !input.activo)) {
      throw new HttpError(400, "No puedes quitarte permisos administrativos ni desactivar tu propio usuario", "INVALID_SELF_UPDATE");
    }

    const data: Record<string, unknown> = {
      nombre: input.nombre,
      apellido: input.apellido,
      email: input.email,
      rol: input.rol,
      activo: input.activo,
      verificado: input.verificado
    };

    if (input.password) {
      if (!validatePasswordStrength(input.password)) {
        throw new HttpError(400, "La contrasena no cumple las reglas de seguridad", "WEAK_PASSWORD");
      }
      data.passwordHash = await hashPassword(input.password);
    }

    const user = await this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.user.update({
        where: { id },
        data
      });

      if (!input.activo || input.password) {
        await tx.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() }
        });
      }

      return updated;
    });

    await this.createAuditLog(meta.userId ?? null, "users.update", meta, {
      userId: id,
      previousRole: existing.rol,
      newRole: input.rol,
      active: input.activo
    });

    return this.toPublicUser(user);
  }

  async deleteUser(id: string, meta: RequestMeta) {
    const existing = await this.requireUser(id);

    if (meta.userId === id) {
      throw new HttpError(400, "No puedes eliminar tu propio usuario", "INVALID_SELF_DELETE");
    }

    if (existing.rol === "admin") {
      const activeAdmins = await this.prisma.user.count({
        where: {
          rol: "admin",
          activo: true,
          id: { not: id }
        }
      });

      if (activeAdmins === 0) {
        throw new HttpError(400, "Debe existir al menos un administrador activo", "LAST_ADMIN_DELETE");
      }
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { activo: false }
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    await this.createAuditLog(meta.userId ?? null, "users.delete", meta, {
      userId: id,
      role: existing.rol
    });
  }

  private async requireUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpError(404, "Usuario no encontrado", "USER_NOT_FOUND");
    }

    return user;
  }

  private async ensureUniqueEmail(email: string, excludeId: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        email,
        id: { not: excludeId }
      }
    });

    if (existing) {
      throw new HttpError(409, "El email ya esta registrado", "EMAIL_TAKEN");
    }
  }

  private toPublicUser(user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: Role;
    activo: boolean;
    verificado: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      verificado: user.verificado,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async createAuditLog(userId: string | null, action: string, meta: RequestMeta, details?: Record<string, unknown>) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        ...(details ? { details: details as any } : {})
      }
    });
  }
}
