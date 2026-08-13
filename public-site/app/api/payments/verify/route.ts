import { NextRequest } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { syncMemberToAirtable } from "@/lib/airtable";
import { computeMembershipEndDate } from "@/lib/format";

const bodySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * Confirms a Razorpay checkout. The signature is cryptographic proof that the
 * payment succeeded. On success we create the membership using calendar-month
 * arithmetic and sync the member to Airtable.
 * Idempotent — repeated calls (double callback, refresh) are safe.
 */
export async function POST(req: NextRequest) {
  try {
    const member = await requireMember();
    const data = bodySchema.parse(await req.json());

    const payment = await prisma.payment.findUnique({ where: { orderId: data.orderId } });
    if (!payment) return fail(new Error("Payment not found"));
    if (payment.memberId !== member.id) return fail(new Error("Not your payment"));

    // Already processed? Return success so the checkout doesn't error on refresh.
    if (payment.status === "PAID" && payment.membershipId) {
      return ok({ alreadyPaid: true, membershipId: payment.membershipId });
    }

    const valid = verifyPaymentSignature(data);
    if (!valid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", paymentId: data.paymentId },
      });
      return fail(new Error("Payment verification failed"));
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: payment.planId } });
    if (!plan) return fail(new Error("Plan not found"));

    const start = new Date();
    // Calendar-month arithmetic: pay on Feb 15 → expires Mar 15 (not Mar 17)
    const end = computeMembershipEndDate(start, plan.durationDays);

    const membership = await prisma.membership.create({
      data: { memberId: payment.memberId, planId: plan.id, startDate: start, endDate: end },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paymentId: data.paymentId,
        signature: data.signature,
        paidAt: new Date(),
        membershipId: membership.id,
      },
    });

    await syncMemberToAirtable({
      name: member.name,
      phone: member.phone,
      email: member.email,
      planName: plan.name,
      amount: payment.amount,
      startDate: start,
      endDate: end,
    });

    return ok({ success: true, membershipId: membership.id, endDate: end.toISOString() });
  } catch (error) {
    return fail(error);
  }
}

