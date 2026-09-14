import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { numTri, strTri, saneMeals, requireValidMemberId } from "@/lib/dietPatch";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const plan = await prisma.dietPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.dietPlan.delete({ where: { id } });
    await logAudit(admin.id, "DELETE_DIET_PLAN", "DietPlan", id);
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
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();

    // Reassignment must point at a real MEMBER account.
    const memberId =
      body.memberId === undefined ? undefined : await requireValidMemberId(body.memberId);

    // Update the plan header fields
    await prisma.dietPlan.update({
      where: { id },
      data: {
        memberId,
        trainerId:
          body.trainerId === undefined
            ? undefined
            : body.trainerId === null || body.trainerId === ""
            ? null
            : String(body.trainerId),
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

    // Replace meals in a transaction when the payload includes them
    const meals = saneMeals(body.meals);
    if (meals) {
      await prisma.$transaction([
        prisma.dietMeal.deleteMany({ where: { dietPlanId: id } }),
        ...meals.map((m) =>
          prisma.dietMeal.create({
            data: { ...m, dietPlanId: id },
          })
        ),
      ]);
    }

    await logAudit(admin.id, "UPDATE_DIET_PLAN", "DietPlan", id);
    const refreshed = await prisma.dietPlan.findUnique({
      where: { id },
      include: {
        meals: { orderBy: { orderIndex: "asc" } },
        member: { select: { name: true } },
        trainer: { select: { id: true, name: true } },
      },
    });
    return ok({ plan: refreshed });
  } catch (e) {
    return fail(e);
  }
}