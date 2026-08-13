import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

/** GET /api/me/measurements — member's own measurement history */
export async function GET() {
  try {
    const user = await requireMember();
    const measurements = await prisma.bodyMeasurement.findMany({
      where: { memberId: user.id },
      orderBy: { recordedAt: "asc" },
    });
    return ok({ measurements });
  } catch (e) {
    return fail(e);
  }
}
