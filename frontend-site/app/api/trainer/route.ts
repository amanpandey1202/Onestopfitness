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
    const [profile, workoutPlans, workoutPlanCount, membersCoached] = await Promise.all([
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
      // Distinct members coached — counted across ALL plans, not just the
      // 30-plan page, so the stat isn't undercounted for busy trainers.
      prisma.workoutPlan.findMany({
        where: { trainerId: trainer.id },
        distinct: ["memberId"],
        select: { memberId: true },
      }),
    ]);

    return ok({
      trainer: {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        profileImageUrl: trainer.profileImageUrl,
      },
      profile,
      stats: { workoutPlans: workoutPlanCount, membersCoached: membersCoached.length },
      workoutPlans,
    });
  } catch (error) {
    return fail(error);
  }
}
