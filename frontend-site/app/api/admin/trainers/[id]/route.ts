import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { trainerUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const trainer = await prisma.user.findUnique({
      where: { id },
      include: { trainerProfile: true },
    });
    if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeTrainer } = trainer;
    return ok({ trainer: safeTrainer });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = trainerUpdateSchema.parse(body);

    const target = await prisma.user.findUnique({
      where: { id },
      include: { trainerProfile: true },
    });
    if (!target) return NextResponse.json({ error: "Trainer not found" }, { status: 404 });

    // Prevent the active admin from accidentally suspending their own account.
    if (id === admin.id && data.isActive === false) {
      return NextResponse.json({ error: "You can't suspend your own account" }, { status: 400 });
    }

    // The gym always needs its founder visible — demote before suspending them.
    if (data.isActive === false && target.trainerProfile?.isFounder) {
      return NextResponse.json(
        { error: "The founder can't be suspended. Unmark them as founder first." },
        { status: 400 }
      );
    }

    const profileFields = {
      specialization: data.specialization,
      bio: data.bio,
      experience: data.experience,
      instagram: data.instagram,
      isActive: data.isActive,
      profileImageUrl: data.profileImageUrl,
      founderNote: data.founderNote,
      founderTitles:
        data.founderTitles === undefined ? undefined : JSON.stringify(data.founderTitles),
      isFounder: data.isFounder,
    };

    // `isActive` is a login-level flag on User (checked by getSessionUser).
    // Surfacing it to the top-level update makes "Suspend" actually revoke
    // portal access, not just flip the trainerProfile display flag.
    const updated = await prisma.$transaction(async (tx) => {
      // Only one founder is allowed — marking someone else as founder demotes
      // whoever currently holds the title, so "founder to everyone" is impossible.
      if (data.isFounder === true) {
        await tx.trainerProfile.updateMany({
          where: { isFounder: true, userId: { not: id } },
          data: { isFounder: false },
        });
      }
      return tx.user.update({
        where: { id },
        data: {
          name: data.name,
          phone: data.phone,
          isActive: data.isActive,
          trainerProfile: {
            upsert: {
              create: { ...profileFields, isActive: data.isActive ?? true, specialization: data.specialization ?? "Trainer" },
              update: profileFields,
            },
          },
        },
      });
    });

    await logAudit(admin.id, data.isActive === false ? "SUSPEND_TRAINER" : "UPDATE_TRAINER", "User", id);
    return ok({ id: updated.id, name: updated.name });
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
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }
    if (target.role === Role.ADMIN) {
      return NextResponse.json({ error: "Admin accounts can't be deleted" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    await logAudit(admin.id, "DELETE_TRAINER", "User", id);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
