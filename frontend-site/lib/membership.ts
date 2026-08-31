import type { PrismaClient } from "@prisma/client";

/**
 * Lazy "auto-resume": there is no background cron in this deployment, so any
 * FROZEN membership whose freeze window (freezeEndsAt) has passed is resumed
 * the next time a membership is read or mutated. This keeps the "auto-resume"
 * promise truthful without a scheduler.
 *
 * Call this at the start of reads/mutations that surface membership status so
 * the DB heals itself and members don't stay FROZEN past freezeEndsAt.
 */
export async function resumeExpiredFreezes(db: PrismaClient): Promise<number> {
  const now = new Date();
  const expiredFrozen = await db.membership.findMany({
    where: {
      status: "FROZEN",
      freezeEndsAt: { not: null, lte: now },
      // Only resume if the membership would still be within paid time.
      endDate: { gte: now },
    },
  });

  for (const m of expiredFrozen) {
    const frozenDays = m.frozenAt
      ? Math.ceil((now.getTime() - new Date(m.frozenAt).getTime()) / 86_400_000)
      : 0;
    await db.membership.update({
      where: { id: m.id },
      data: {
        status: "ACTIVE",
        frozenAt: null,
        freezeEndsAt: null,
        endDate: new Date(new Date(m.endDate).getTime() + frozenDays * 86_400_000),
        totalFrozenDays: m.totalFrozenDays + frozenDays,
      },
    });
  }

  return expiredFrozen.length;
}
