import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { planUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = planUpdateSchema.parse(body);

    const plan = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const updated = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays,
        features: data.features === undefined ? undefined : JSON.stringify(data.features),
        isActive: data.isActive,
      },
    });

    await logAudit(admin.id, "UPDATE_PLAN", "MembershipPlan", id, { name: updated.name, price: updated.price });
    return ok({ id: updated.id, name: updated.name });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const plan = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    await prisma.membershipPlan.delete({ where: { id } });
    await logAudit(admin.id, "DELETE_PLAN", "MembershipPlan", id, { name: plan.name });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
