import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, created } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { syncMemberToAirtable } from "@/lib/airtable";
import { computeMembershipEndDate } from "@/lib/format";

const assignSchema = z.object({
  planId: z.string().min(1),
  startDate: z.string().optional(),
});

/**
 * Assigns (or renews) a membership for a member from a chosen plan.
 * End date is computed using calendar-month arithmetic:
 *   - Feb 15 + 30 days plan → Mar 15  (not Mar 17)
 *   - Dec 29 + 30 days plan → Jan 29  (not Dec 29 + 30 = Jan 28 edge case)
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = assignSchema.parse(body);

    const plan = await prisma.membershipPlan.findUnique({ where: { id: data.planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const start = data.startDate ? new Date(data.startDate) : new Date();
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }

    // Calendar-month arithmetic: Feb 15 → Mar 15, Dec 29 → Jan 29
    const end = computeMembershipEndDate(start, plan.durationDays);

    const membership = await prisma.membership.create({
      data: { memberId: id, planId: plan.id, startDate: start, endDate: end },
    });

    const member = await prisma.user.findUnique({ where: { id } });
    if (member) {
      await syncMemberToAirtable({
        name: member.name,
        phone: member.phone,
        email: member.email,
        planName: plan.name,
        amount: plan.price,
        startDate: start,
        endDate: end,
      });
    }

    await logAudit(admin.id, "ASSIGN_MEMBERSHIP", "Membership", membership.id, {
      memberId: id,
      planId: plan.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    return created({ id: membership.id, startDate: start, endDate: end });
  } catch (error) {
    return fail(error);
  }
}

