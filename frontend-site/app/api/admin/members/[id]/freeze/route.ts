import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { resumeExpiredFreezes } from "@/lib/membership";

const freezeSchema = z.object({
  action: z.enum(["freeze", "unfreeze"]),
  membershipId: z.string().min(1),
  // Optional: how many days to freeze (admin sets an expected return date)
  freezeDays: z.number().int().min(1).max(90).optional(),
});

/**
 * POST /api/admin/members/[id]/freeze
 *
 * Freeze: pauses a membership. Status = FROZEN, endDate is NOT extended yet.
 * Unfreeze: resumes the membership. The actual frozen days are added to endDate
 * so the member doesn't lose any paid time.
 *
 * Example:
 *   Membership ends Jan 31. Member freezes Jan 10, unfreezes Jan 20 (10 days).
 *   New endDate = Jan 31 + 10 days = Feb 10.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = freezeSchema.parse(body);

    // Lazily auto-resume any freezes whose window has already ended,
    // then re-fetch the target so the current state is accurate.
    await resumeExpiredFreezes(prisma);

    const membership = await prisma.membership.findUnique({ where: { id: data.membershipId } });
    if (!membership || membership.memberId !== id) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const now = new Date();

    if (data.action === "freeze") {
      if (membership.status === "FROZEN") {
        return NextResponse.json({ error: "Membership is already frozen." }, { status: 409 });
      }
      if (membership.status !== "ACTIVE") {
        return NextResponse.json({ error: "Only active memberships can be frozen." }, { status: 400 });
      }

      const freezeEndsAt = data.freezeDays
        ? new Date(now.getTime() + data.freezeDays * 86_400_000)
        : null;

      await prisma.membership.update({
        where: { id: data.membershipId },
        data: {
          status: "FROZEN",
          frozenAt: now,
          freezeEndsAt,
        },
      });

      await logAudit(admin.id, "FREEZE_MEMBERSHIP", "Membership", data.membershipId, {
        memberId: id,
        frozenAt: now.toISOString(),
        freezeDays: data.freezeDays,
      });

      return ok({
        success: true,
        message: `Membership frozen. ${data.freezeDays ? `Will auto-resume in ${data.freezeDays} days.` : "Resume manually when member returns."}`,
      });
    }

    if (data.action === "unfreeze") {
      if (membership.status !== "FROZEN") {
        return NextResponse.json({ error: "Membership is not frozen." }, { status: 409 });
      }
      if (!membership.frozenAt) {
        return NextResponse.json({ error: "Freeze start date missing." }, { status: 400 });
      }

      // Calculate actual frozen days
      const frozenDays = Math.ceil(
        (now.getTime() - new Date(membership.frozenAt).getTime()) / 86_400_000
      );

      // Extend the end date by exactly the number of frozen days
      const newEndDate = new Date(
        new Date(membership.endDate).getTime() + frozenDays * 86_400_000
      );

      await prisma.membership.update({
        where: { id: data.membershipId },
        data: {
          status: "ACTIVE",
          endDate: newEndDate,
          frozenAt: null,
          freezeEndsAt: null,
          totalFrozenDays: membership.totalFrozenDays + frozenDays,
        },
      });

      await logAudit(admin.id, "UNFREEZE_MEMBERSHIP", "Membership", data.membershipId, {
        memberId: id,
        frozenDays,
        newEndDate: newEndDate.toISOString(),
      });

      return ok({
        success: true,
        frozenDays,
        newEndDate: newEndDate.toISOString(),
        message: `Membership resumed. End date extended by ${frozenDays} day${frozenDays === 1 ? "" : "s"} to ${newEndDate.toLocaleDateString("en-IN")}.`,
      });
    }
  } catch (e) {
    return fail(e);
  }
}
