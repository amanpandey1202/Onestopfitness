import type { PrismaClient } from "@prisma/client";

/**
 * Generates the next sequential member code (OSF001, OSF002, …).
 * Scans the highest existing numeric suffix so codes are never reused.
 * Concurrency-safe: callers retry the create once if a duplicate sneaks in.
 */
export async function nextMemberCode(db: PrismaClient): Promise<string> {
  const users = await db.user.findMany({
    where: { role: "MEMBER", memberCode: { not: null } },
    select: { memberCode: true },
  });

  let max = 0;
  for (const u of users) {
    const n = parseInt((u.memberCode ?? "").replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }

  return `OSF${String(max + 1).padStart(3, "0")}`;
}

/** Formats a member's code for display, falling back to a dash. */
export function formatMemberCode(code: string | null | undefined): string {
  return code || "—";
}
