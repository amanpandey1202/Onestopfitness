import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

/**
 * Trainer dashboard data: their own profile plus the workout plans they've
 * authored (with the member each plan belongs to).
 */
export async function GET() {
  try {
    const trainer = await requireRole(Role.TRAINER);
    const [profile, workoutPlans, memberCount] = await Promise.all([
      prisma.trainerProfile.findUnique({ where: { userId: trainer.id } }),
      prisma.workoutPlan.findMany({
        where: { trainerId: trainer.id },
        orderBy: { updatedAt: "desc" },
        include: {
          member: { select: { id: true, name: true } },
          exercises: { orderBy: { orderIndex: "asc" } },
        },
        take: 30,
      }),
      prisma.workoutPlan.count({ where: { trainerId: trainer.id } }),
    ]);

    const memberIds = workoutPlans.map((p) => p.memberId);
    return ok({
      trainer: {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        profileImageUrl: trainer.profileImageUrl,
      },
      profile,
      stats: { workoutPlans: memberCount, membersCoached: new Set(memberIds).size },
      workoutPlans,
    });
  } catch (error) {
    return fail(error);
  }
}
