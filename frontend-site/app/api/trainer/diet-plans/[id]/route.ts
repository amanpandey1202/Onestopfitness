import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { numTri, strTri, saneMeals, requireValidMemberId } from "@/lib/dietPatch";

async function ownedPlanOrResponse(trainerId: string, planId: string) {
  const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return { plan: null, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  if (plan.trainerId !== trainerId) {
    return {
      plan,
      response: NextResponse.json(
        {
          error:
            plan.trainerId === null
              ? "This plan was created by an admin and can only be edited from the admin portal."
              : "You can only manage your own diet plans",
        },
        { status: 403 }
      ),
    };
  }
  return { plan, response: null };
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const trainer = await requireRole(Role.TRAINER);
    const { id } = await ctx.params;
    const { response: denied } = await ownedPlanOrResponse(trainer.id, id);
    if (denied) return denied;

    await prisma.dietPlan.delete({ where: { id } });
    await logAudit(trainer.id, "DELETE_DIET_PLAN", "DietPlan", id);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const trainer = await requireRole(Role.TRAINER);
    const { id } = await ctx.params;
    const { response: denied } = await ownedPlanOrResponse(trainer.id, id);
    if (denied) return denied;

    const body = await req.json();

    // Reassignment must point at a real MEMBER account — same rule as POST.
    const memberId =
      body.memberId === undefined ? undefined : await requireValidMemberId(body.memberId);

    await prisma.dietPlan.update({
      where: { id },
      data: {
        memberId,
        title: body.title === undefined ? undefined : String(body.title),
        description: strTri(body.description),
        goal: strTri(body.goal),
        calorieTarget: numTri(body.calorieTarget),
        proteinGm: numTri(body.proteinGm),
        carbsGm: numTri(body.carbsGm),
        fatGm: numTri(body.fatGm),
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
      },
    });

    // Replace meals in a transaction when the payload includes them.
    const meals = saneMeals(body.meals);
    if (meals) {
      await prisma.$transaction([
        prisma.dietMeal.deleteMany({ where: { dietPlanId: id } }),
        ...meals.map((m) =>
          prisma.dietMeal.create({ data: { ...m, dietPlanId: id } })
        ),
      ]);
    }

    await logAudit(trainer.id, "UPDATE_DIET_PLAN", "DietPlan", id);
    const refreshed = await prisma.dietPlan.findUnique({
      where: { id },
      include: {
        meals: { orderBy: { orderIndex: "asc" } },
        member: { select: { id: true, name: true, memberCode: true } },
      },
    });
    return ok({ plan: refreshed });
  } catch (e) {
    return fail(e);
  }
}