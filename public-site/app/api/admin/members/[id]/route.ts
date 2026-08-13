import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { memberUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { encryptField, decryptField } from "@/lib/crypto";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        memberProfile: true,
        memberships: { include: { plan: true }, orderBy: { endDate: "desc" } },
        attendance: { orderBy: { checkIn: "desc" }, take: 20 },
        competitionEntries: { include: { competition: true } },
      },
    });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeMember } = member;
    if (safeMember.memberProfile) {
      safeMember.memberProfile.aadhaarNumber = decryptField(safeMember.memberProfile.aadhaarNumber);
    }
    return ok({ member: safeMember });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = memberUpdateSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        isActive: data.isActive,
        memberProfile: {
          update: {
            fitnessGoal: data.fitnessGoal,
            notes: data.notes,
            ...(data.joiningDate ? { joiningDate: data.joiningDate } : {}),
            alternatePhone: data.alternatePhone,
            aadhaarNumber: data.aadhaarNumber ? encryptField(data.aadhaarNumber) : undefined,
            address: data.address,
            parentName: data.parentName,
            parentPhone: data.parentPhone,
          },
        },
      },
    });

    if (data.isActive !== undefined) {
      await logAudit(admin.id, data.isActive ? "ACTIVATE_MEMBER" : "SUSPEND_MEMBER", "User", id);
    } else {
      await logAudit(admin.id, "UPDATE_MEMBER", "User", id);
    }

    return ok({ id: updated.id, name: updated.name, isActive: updated.isActive });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    if (id === admin.id) {
      return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    await prisma.user.delete({ where: { id } });
    await logAudit(admin.id, "DELETE_MEMBER", "User", id, { email: user.email });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
