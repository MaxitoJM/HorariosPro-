import type { PrismaClient } from "@prisma/client";
import { env } from "../../config/env.js";
import type { Role } from "../../constants/roles.js";
import { HttpError } from "../../utils/http-error.js";
import { signAccessToken } from "../../utils/jwt.js";
import {
  comparePassword,
  generateOpaqueToken,
  hashPassword,
  hashToken,
  validatePasswordStrength
} from "../../utils/security.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};

type RegisterInput = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol?: Role;
};

type LoginInput = {
  email: string;
  password: string;
};

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(input: RegisterInput, meta: RequestMeta) {
    if (!validatePasswordStrength(input.password)) {
      throw new HttpError(400, "La contrasena no cumple las reglas de seguridad", "WEAK_PASSWORD");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError(409, "El email ya esta registrado", "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        passwordHash,
        rol: input.rol ?? "estudiante",
        activo: true,
        verificado: false
      }
    });

    await this.createAuditLog(user.id, "auth.register", meta);
    const session = await this.issueSession(user.id, user.email, user.rol as Role, meta);

    return {
      user: this.toPublicUser(user),
      ...session
    };
  }

  async login(input: LoginInput, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.activo) {
      throw new HttpError(401, "Credenciales invalidas", "INVALID_CREDENTIALS");
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, "Credenciales invalidas", "INVALID_CREDENTIALS");
    }

    await this.createAuditLog(user.id, "auth.login", meta);
    const session = await this.issueSession(user.id, user.email, user.rol as Role, meta);

    return {
      user: this.toPublicUser(user),
      ...session
    };
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    const tokenHash = hashToken(refreshToken);
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date() || !tokenRecord.user.activo) {
      throw new HttpError(401, "Refresh token invalido", "INVALID_REFRESH_TOKEN");
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() }
    });

    const session = await this.issueSession(
      tokenRecord.user.id,
      tokenRecord.user.email,
      tokenRecord.user.rol as Role,
      meta
    );
    await this.createAuditLog(tokenRecord.user.id, "auth.refresh", meta);

    return {
      user: this.toPublicUser(tokenRecord.user),
      ...session
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  async logoutAll(userId: string, meta: RequestMeta) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    await this.createAuditLog(userId, "auth.logout_all", meta);
  }

  async forgotPassword(email: string, meta: RequestMeta) {
    const genericResponse = {
      message: "Si el email existe, recibiras instrucciones para restablecer tu contrasena"
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.activo) {
      return genericResponse;
    }

    const rawToken = generateOpaqueToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    await this.createAuditLog(user.id, "auth.forgot_password", meta);

    return {
      ...genericResponse,
      ...(env.NODE_ENV === "development" ? { debugResetToken: rawToken } : {})
    };
  }

  async resetPassword(token: string, password: string, meta: RequestMeta) {
    if (!validatePasswordStrength(password)) {
      throw new HttpError(400, "La contrasena no cumple las reglas de seguridad", "WEAK_PASSWORD");
    }

    const tokenHash = hashToken(token);
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date() || !resetRecord.user.activo) {
      throw new HttpError(400, "Token de restablecimiento invalido o expirado", "INVALID_RESET_TOKEN");
    }

    const newPasswordHash = await hashPassword(password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash }
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() }
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: resetRecord.userId,
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      })
    ]);

    await this.createAuditLog(resetRecord.userId, "auth.reset_password", meta);

    return {
      message: "Contrasena actualizada correctamente"
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.activo) {
      throw new HttpError(404, "Usuario no encontrado", "USER_NOT_FOUND");
    }

    return this.toPublicUser(user);
  }

  private async issueSession(userId: string, email: string, rol: Role, meta: RequestMeta) {
    const accessToken = signAccessToken({ sub: userId, email, rol });
    const refreshToken = generateOpaqueToken(48);
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null
      }
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt
    };
  }

  private async createAuditLog(userId: string | null, action: string, meta: RequestMeta) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null
      }
    });
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
}
