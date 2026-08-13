import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

/** GET — list of members that have plans from this trainer */
export async function GET() {
  try {
    const trainer = await requireRole(Role.TRAINER);

    // Members who have any workout plan from this trainer
    const membersWithPlans = await prisma.workoutPlan.findMany({
      where: { trainerId: trainer.id },
      select: { memberId: true },
      distinct: ["memberId"],
    });

    const memberIds = membersWithPlans.map((p) => p.memberId);

    const members = await prisma.user.findMany({
      where: { id: { in: memberIds }, role: "MEMBER" },
      select: {
        id: true,
        name: true,
        memberCode: true,
        phone: true,
        memberships: {
          where: { status: "ACTIVE" },
          include: { plan: { select: { name: true } } },
          orderBy: { endDate: "desc" },
          take: 1,
        },
        attendance: {
          orderBy: { checkIn: "desc" },
          take: 1,
        },
      },
    });

    // Also fetch all members (for assigning new plans)
    const allMembers = await prisma.user.findMany({
      where: { role: "MEMBER", isActive: true },
      select: { id: true, name: true, memberCode: true },
      orderBy: { name: "asc" },
    });

    return ok({ myMembers: members, allMembers });
  } catch (e) {
    return fail(e);
  }
}
