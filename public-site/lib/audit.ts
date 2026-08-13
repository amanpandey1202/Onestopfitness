import { prisma } from "@/lib/db";

/**
 * Records an important action (admin mutations) for the audit trail.
 */
export async function logAudit(
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: unknown
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      entityType,
      entityId,
      metadata: metadata === undefined ? null : JSON.stringify(metadata),
    },
  });
}
