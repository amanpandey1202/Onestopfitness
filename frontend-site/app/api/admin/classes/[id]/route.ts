import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const cls = await prisma.classSchedule.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description ?? null,
        trainerId: body.trainerId ?? null,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        maxCapacity: body.maxCapacity,
        location: body.location ?? null,
        isActive: body.isActive,
      },
    });
    await logAudit(admin.id, "UPDATE_CLASS", "ClassSchedule", id);
    return ok({ cls });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const cls = await prisma.classSchedule.findUnique({ where: { id } });
    if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.classSchedule.update({ where: { id }, data: { isActive: false } });
    await logAudit(admin.id, "DELETE_CLASS", "ClassSchedule", id);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
