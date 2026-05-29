import type { Prisma, PrismaClient } from "@prisma/client";

// Helper centralizado para audit log enriquecido.
//
// Diferencia con `prisma.auditLog.create({...})` ad-hoc en cada service:
// - Estructura `details` JSON con shape estable (entityType, entityId, before, after, extra).
// - Nunca lanza: si el audit falla, no debe romper la operación principal.
// - Se puede llamar dentro o fuera de una transacción (recibe el client a usar).
//
// Convención de `action`: "<modulo>.<verbo>", ej. "users.block", "courses.softDelete".

export type AuditMeta = {
  userId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export type AuditEvent = {
  action: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  extra?: Record<string, unknown>;
};

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export async function audit(
  client: PrismaLike,
  meta: AuditMeta,
  event: AuditEvent
): Promise<void> {
  try {
    const details: Record<string, unknown> = {};
    if (event.entityType) details.entityType = event.entityType;
    if (event.entityId) details.entityId = event.entityId;
    if (event.before !== undefined) details.before = event.before;
    if (event.after !== undefined) details.after = event.after;
    if (event.extra) Object.assign(details, event.extra);

    const data: Prisma.AuditLogUncheckedCreateInput = {
      userId: meta.userId ?? null,
      action: event.action,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null
    };
    if (Object.keys(details).length > 0) {
      data.details = details as Prisma.InputJsonValue;
    }
    await client.auditLog.create({ data });
  } catch {
    // Audit no debe interrumpir el flujo. En el futuro: log estructurado a stderr.
  }
}
