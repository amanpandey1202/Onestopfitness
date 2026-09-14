import { prisma } from "@/lib/db";
import { computeMembershipEndDate } from "@/lib/format";
import { syncMemberToAirtable } from "@/lib/airtable";

/**
 * Shared, idempotent payment fulfillment.
 *
 * Marks a payment PAID and activates/extends the member's membership exactly
 * once. Used by:
 *  - the Razorpay webhook (browser closed mid-payment),
 *  - the daily cron reconciliation (stale CREATED orders settled at Razorpay
 *    but never verified by the client).
 *
 * Idempotency: a PAID payment short-circuits, so webhook + cron + browser
 * verify cannot double-extend a membership.
 */
export type FulfillResult =
  | { skipped: true }
  | { alreadyPaid: true }
  | { fulfilled: true; membershipId: string };

export async function fulfillPaidOrder(opts: {
  orderId: string;
  paymentId?: string;
  signature?: string;
  method: "RAZORPAY" | "TEST_MODE";
}): Promise<FulfillResult> {
  const payment = await prisma.payment.findUnique({ where: { orderId: opts.orderId } });
  if (!payment) return { skipped: true };
  if (payment.status === "PAID") return { alreadyPaid: true };

  const member = await prisma.user.findUnique({ where: { id: payment.memberId } });
  const plan = await prisma.membershipPlan.findUnique({ where: { id: payment.planId } });
  if (!member || !plan) return { skipped: true };

  const now = new Date();

  // Renewing an active plan? Extend from the current end date; otherwise start fresh.
  const existingActive = await prisma.membership.findFirst({
    where: {
      memberId: member.id,
      status: "ACTIVE",
      endDate: { gte: now },
    },
    orderBy: { endDate: "desc" },
  });

  let startDate: Date;
  let endDate: Date;
  let membership;

  if (existingActive) {
    startDate = existingActive.startDate;
    endDate = computeMembershipEndDate(existingActive.endDate, plan.durationDays);
    membership = await prisma.membership.update({
      where: { id: existingActive.id },
      data: { endDate },
    });
  } else {
    startDate = now;
    endDate = computeMembershipEndDate(startDate, plan.durationDays);
    membership = await prisma.membership.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        startDate,
        endDate,
        status: "ACTIVE",
      },
    });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      paymentId: opts.paymentId ?? null,
      signature: opts.signature ?? null,
      paidAt: now,
      method: opts.method,
      membershipId: membership.id,
    },
  });

  // Mark user profile as active.
  await prisma.user
    .update({
      where: { id: member.id },
      data: { isActive: true },
    })
    .catch(() => {});

  // Best-effort CRM sync — never fail fulfillment because Airtable is down.
  await syncMemberToAirtable({
    name: member.name,
    phone: member.phone,
    email: member.email,
    planName: plan.name,
    amount: payment.amount,
    startDate,
    endDate,
  }).catch(console.error);

  return { fulfilled: true, membershipId: membership.id };
}