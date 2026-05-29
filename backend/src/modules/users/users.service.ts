import type { Prisma, PrismaClient } from "@prisma/client";
import type { Role } from "../../constants/roles.js";
import { audit } from "../../utils/audit.js";
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
  deleted?: boolean;
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
  constructor(private readonly prisma: PrismaClient) {}

  async listUsers(filters: ListUsersFilters = {}) {
    const search = filters.search?.trim();
    const users = await this.prisma.user.findMany({
      where: {
        // Vista papelera: deleted=true muestra SOLO borrados (la clave deletedAt
        // presente hace que la soft-delete extension no inyecte su filtro).
        ...(filters.deleted ? { deletedAt: { not: null } } : {}),
        ...(filters.includeInactive || filters.deleted ? {} : { activo: true }),
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

    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

    if (existing.deletedAt) {
      throw new HttpError(409, "El usuario ya fue eliminado", "USER_ALREADY_DELETED");
    }

    if (meta.userId === id) {
      throw new HttpError(400, "No puedes eliminar tu propio usuario", "SELF_DELETE_FORBIDDEN");
    }

    if (existing.rol === "admin") {
      const activeAdmins = await this.prisma.user.count({
        where: {
          rol: "admin",
          status: "active",
          id: { not: id }
        }
      });

      if (activeAdmins === 0) {
        throw new HttpError(409, "Debe existir al menos un administrador activo", "LAST_ADMIN");
      }
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: now, deletedBy: meta.userId ?? null }
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now }
      })
    ]);

    await audit(this.prisma, meta, {
      action: "users.softDelete",
      entityType: "user",
      entityId: id,
      before: { id, email: existing.email, rol: existing.rol, activo: existing.activo },
      after: { id, deletedAt: now.toISOString(), deletedBy: meta.userId ?? null }
    });
  }

  async restoreUser(id: string, meta: RequestMeta) {
    const existing = await this.requireUser(id);

    if (!existing.deletedAt) {
      throw new HttpError(409, "El usuario no esta eliminado", "USER_NOT_DELETED");
    }

    // Validar conflicto de email único contra users activos (no borrados).
    const conflict = await this.prisma.user.findFirst({
      where: { email: existing.email, id: { not: id } }
    });
    if (conflict) {
      throw new HttpError(
        409,
        "Otro usuario activo ya usa este email. Cambielo antes de restaurar.",
        "EMAIL_CONFLICT_ON_RESTORE"
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null }
    });

    await audit(this.prisma, meta, {
      action: "users.restore",
      entityType: "user",
      entityId: id,
      before: { id, deletedAt: existing.deletedAt?.toISOString() ?? null, deletedBy: existing.deletedBy ?? null },
      after: { id, deletedAt: null, deletedBy: null }
    });

    return this.toPublicUser(existing);
  }

  async blockUser(id: string, input: { reason?: string; until?: string }, meta: RequestMeta) {
    const existing = await this.requireUser(id);

    if (existing.deletedAt) {
      throw new HttpError(409, "No puedes bloquear un usuario eliminado", "USER_DELETED");
    }
    if (meta.userId === id) {
      throw new HttpError(409, "No puedes bloquearte a ti mismo", "SELF_BLOCK_FORBIDDEN");
    }
    if (existing.status === "blocked") {
      throw new HttpError(409, "El usuario ya esta bloqueado", "ALREADY_BLOCKED");
    }
    if (existing.rol === "admin") {
      const activeAdmins = await this.prisma.user.count({
        where: { rol: "admin", status: "active", id: { not: id } }
      });
      if (activeAdmins === 0) {
        throw new HttpError(409, "Debe existir al menos un administrador activo", "LAST_ADMIN");
      }
    }

    const blockedUntil = input.until ? new Date(input.until) : null;
    const blockReason = input.reason ?? null;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { status: "blocked", blockedUntil, blockReason }
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    await audit(this.prisma, meta, {
      action: "users.block",
      entityType: "user",
      entityId: id,
      before: { id, status: existing.status, blockedUntil: existing.blockedUntil, blockReason: existing.blockReason },
      after: { id, status: "blocked", blockedUntil: blockedUntil?.toISOString() ?? null, blockReason }
    });

    return this.toPublicUser(existing);
  }

  async unblockUser(id: string, meta: RequestMeta) {
    const existing = await this.requireUser(id);

    if (existing.deletedAt) {
      throw new HttpError(409, "El usuario esta eliminado", "USER_DELETED");
    }
    if (existing.status !== "blocked") {
      throw new HttpError(409, "El usuario no esta bloqueado", "NOT_BLOCKED");
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: "active", blockedUntil: null, blockReason: null }
    });

    await audit(this.prisma, meta, {
      action: "users.unblock",
      entityType: "user",
      entityId: id,
      before: { id, status: existing.status, blockedUntil: existing.blockedUntil, blockReason: existing.blockReason },
      after: { id, status: "active", blockedUntil: null, blockReason: null }
    });

    return this.toPublicUser(existing);
  }

  private async requireUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpError(404, "Usuario no encontrado", "USER_NOT_FOUND");
    }

    return user;
  }

  private async ensureUniqueEmail(email: string, excludeId: string) {
    // findUnique ve soft-deleted (constraint global). Ver nota en teachers.service.
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== excludeId) {
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
    status?: "active" | "suspended" | "blocked";
    blockedUntil?: Date | null;
    blockReason?: string | null;
    deletedAt?: Date | null;
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
      status: user.status ?? "active",
      blockedUntil: user.blockedUntil ?? null,
      blockReason: user.blockReason ?? null,
      deletedAt: user.deletedAt ?? null,
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
