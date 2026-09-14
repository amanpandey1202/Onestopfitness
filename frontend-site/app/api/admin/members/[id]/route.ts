import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: { memberProfile: true },
    });
    if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    // This endpoint manages member accounts only; never let a member-scoped
    // request touch ADMIN/TRAINER accounts (rename, deactivate, profile PII).
    if (user.role !== Role.MEMBER) {
      return NextResponse.json({ error: "This endpoint only manages member accounts" }, { status: 400 });
    }

    // Prevent the active admin from accidentally suspending/deactivating their own account.
    if (id === admin.id && data.isActive === false) {
      return NextResponse.json({ error: "You can't suspend your own account" }, { status: 400 });
    }

    const profileData = {
      fitnessGoal: data.fitnessGoal,
      notes: data.notes,
      // joiningDate column is NOT NULL; a real value writes, otherwise skip.
      ...(data.joiningDate ? { joiningDate: data.joiningDate } : {}),
      alternatePhone: data.alternatePhone,
      aadhaarNumber:
        data.aadhaarNumber === null
          ? null
          : data.aadhaarNumber
            ? encryptField(data.aadhaarNumber)
            : undefined,
      address: data.address,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      emergencyContact: data.emergencyContact,
    };

    // A user could lack a MemberProfile (e.g. legacy/imported accounts). Use
    // upsert so PATCH never throws P2025 on a missing profile row.
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        isActive: data.isActive,
        ...(data.markEmailVerified
          ? {
              emailVerified: new Date(),
              verifyToken: null,
              verifyTokenExpires: null,
            }
          : {}),
        memberProfile: {
          upsert: {
            create: profileData,
            update: profileData,
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

    // Only member accounts can be deleted via this endpoint — never staff.
    if (user.role !== Role.MEMBER) {
      return NextResponse.json({ error: "Only member accounts can be deleted here" }, { status: 400 });
    }

    // AuditLog has no onDelete:Cascade, so we clear it first before deleting the user.
    // All other relations (Session, MemberProfile, Membership, Attendance, Payment,
    // BodyMeasurement, WorkoutPlan, ClassBooking, CompetitionParticipant, Notification,
    // DietPlan) already have onDelete:Cascade in the schema.
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { actorUserId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    await logAudit(admin.id, "DELETE_MEMBER", "User", id, { email: user.email });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
