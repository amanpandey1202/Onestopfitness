import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

/** GET /api/me/diet — member's active diet plan(s) */
export async function GET() {
  try {
    const user = await requireMember();
    const plans = await prisma.dietPlan.findMany({
      where: { memberId: user.id, isActive: true },
      include: {
        meals: { orderBy: { orderIndex: "asc" } },
        trainer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return ok({ plans });
  } catch (e) {
    return fail(e);
  }
}
