import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { logAudit } from "@/lib/audit";

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
    const plan = await prisma.dietPlan.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description ?? null,
        goal: body.goal ?? null,
        calorieTarget: body.calorieTarget ?? null,
        proteinGm: body.proteinGm ?? null,
        carbsGm: body.carbsGm ?? null,
        fatGm: body.fatGm ?? null,
        isActive: body.isActive,
      },
    });
    await logAudit(admin.id, "UPDATE_DIET_PLAN", "DietPlan", id);
    return ok({ plan });
  } catch (e) {
    return fail(e);
  }
}
