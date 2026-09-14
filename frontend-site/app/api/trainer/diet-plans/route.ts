import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { dietPlanSchema } from "@/lib/dietSchemas";

/** GET — all diet plans authored by this trainer. */
export async function GET() {
  try {
    const trainer = await requireRole(Role.TRAINER);
    const plans = await prisma.dietPlan.findMany({
      where: { trainerId: trainer.id },
      include: {
        member: { select: { id: true, name: true, memberCode: true } },
        meals: { orderBy: { orderIndex: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return ok({ plans });
  } catch (e) {
    return fail(e);
  }
}

/** POST — trainer creates a new diet plan for a member (always owned by them). */
export async function POST(req: NextRequest) {
  try {
    const trainer = await requireRole(Role.TRAINER);
    const body = await req.json();
    const data = dietPlanSchema.parse(body);

    // The trainer can only author for real MEMBER accounts.
    const member = await prisma.user.findUnique({ where: { id: data.memberId } });
    if (!member || member.role !== "MEMBER") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const plan = await prisma.dietPlan.create({
      data: {
        memberId: data.memberId,
        // Ownership is always the calling trainer — never trust the client.
        trainerId: trainer.id,
        title: data.title,
        description: data.description ?? null,
        goal: data.goal ?? null,
        calorieTarget: data.calorieTarget ?? null,
        proteinGm: data.proteinGm ?? null,
        carbsGm: data.carbsGm ?? null,
        fatGm: data.fatGm ?? null,
        meals: {
          create: data.meals.map((m, i) => ({
            mealName: m.mealName,
            timing: m.timing ?? null,
            items: m.items,
            calories: m.calories ?? null,
            dayOfWeek: m.dayOfWeek ?? null,
            orderIndex: m.orderIndex ?? i,
          })),
        },
      },
      include: { meals: { orderBy: { orderIndex: "asc" } } },
    });

    await logAudit(trainer.id, "CREATE_DIET_PLAN", "DietPlan", plan.id, {
      memberId: data.memberId,
    });
    return created({ plan });
  } catch (e) {
    return fail(e);
  }
}