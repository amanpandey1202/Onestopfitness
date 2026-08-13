import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/cron/cleanup
 * Deletes expired sessions from the DB to prevent unbounded growth.
 * Call this from a cron job (e.g. Vercel Cron, GitHub Actions, uptime robot)
 * with the header: Authorization: Bearer <CRON_SECRET>
 *
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }]
 * }
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 401 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  // Also auto-resume any frozen memberships that have passed their freezeEndsAt date
  const frozenMemberships = await prisma.membership.findMany({
    where: {
      status: "FROZEN",
      freezeEndsAt: { lte: now },
    },
  });

  let resumedCount = 0;
  for (const mem of frozenMemberships) {
    if (!mem.frozenAt) continue;
    const frozenDays = Math.ceil(
      (now.getTime() - new Date(mem.frozenAt).getTime()) / 86_400_000
    );
    const newEndDate = new Date(
      new Date(mem.endDate).getTime() + frozenDays * 86_400_000
    );
    await prisma.membership.update({
      where: { id: mem.id },
      data: {
        status: "ACTIVE",
        endDate: newEndDate,
        frozenAt: null,
        freezeEndsAt: null,
        totalFrozenDays: mem.totalFrozenDays + frozenDays,
      },
    });
    resumedCount++;
  }

  return NextResponse.json({
    success: true,
    expiredSessionsDeleted: result.count,
    membershipsAutoResumed: resumedCount,
    ranAt: now.toISOString(),
  });
}
