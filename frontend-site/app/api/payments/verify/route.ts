import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { razorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";
import { syncMemberToAirtable } from "@/lib/airtable";
import { computeMembershipEndDate } from "@/lib/format";

const bodySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
});

/**
 * Confirms a payment. On success, creates or extends the membership using
 * calendar-month arithmetic and syncs the member to Airtable.
 * Idempotent — repeated calls (double callback, refresh) return the success payload cleanly.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = bodySchema.parse(body);

    const payment = await prisma.payment.findUnique({ where: { orderId: data.orderId } });
    if (!payment) return fail(new Error("Payment record not found. Please try again."));

    let member = await getSessionUser();
    if (!member) {
      member = await prisma.user.findUnique({ where: { id: payment.memberId } });
    }
    if (!member) return fail(new Error("Member not found for this payment."));

    // Already processed? Return success redirect
    if (payment.status === "PAID" && payment.membershipId) {
      return ok({
        success: true,
        alreadyPaid: true,
        membershipId: payment.membershipId,
        redirectUrl: `/member/pay/success?paymentId=${payment.id}`,
      });
    }

    // Test-mode is derived purely from server-side state: the order must have
    // been created as a TEST_MODE order AND Razorpay must genuinely be
    // unconfigured AND we are not in a production build/deploy. It is NEVER
    // controlled by the client (prevents free-membership exploits where a
    // caller flips a client-supplied isTestMode flag).
    const isTest =
      payment.method === "TEST_MODE" &&
      !razorpayConfigured() &&
      process.env.NODE_ENV !== "production";

    if (!isTest) {
      if (!data.paymentId || !data.signature) {
        return fail(new Error("Missing Razorpay payment proof credentials."));
      }
      const valid = verifyPaymentSignature({
        orderId: data.orderId,
        paymentId: data.paymentId,
        signature: data.signature,
      });
      if (!valid) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", paymentId: data.paymentId },
        });
        return fail(new Error("Payment signature verification failed. Payment was rejected."));
      }
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: payment.planId } });
    if (!plan) return fail(new Error("Plan not found."));

    const now = new Date();

    // Check if member already has an ACTIVE membership to extend
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
      // Member ALREADY PAID & has active plan -> EXTEND membership end date!
      startDate = existingActive.startDate;
      // Compute extended end date starting from current endDate
      endDate = computeMembershipEndDate(existingActive.endDate, plan.durationDays);

      membership = await prisma.membership.update({
        where: { id: existingActive.id },
        data: { endDate },
      });
    } else {
      // New or Expired Member -> Create fresh membership
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

    const payId = data.paymentId || `pay_${isTest ? "test" : "online"}_${Date.now()}`;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paymentId: payId,
        signature: data.signature || (isTest ? "test_signature" : null),
        paidAt: now,
        method: isTest ? "TEST_MODE" : "RAZORPAY",
        membershipId: membership.id,
      },
    });

    // Also ensure member user profile is marked active
    await prisma.user.update({
      where: { id: member.id },
      data: { isActive: true },
    }).catch(() => {});

    await syncMemberToAirtable({
      name: member.name,
      phone: member.phone,
      email: member.email,
      planName: plan.name,
      amount: payment.amount,
      startDate,
      endDate,
    });

    return ok({
      success: true,
      membershipId: membership.id,
      paymentId: payment.id,
      endDate: endDate.toISOString(),
      redirectUrl: `/member/pay/success?paymentId=${payment.id}`,
    });
  } catch (error) {
    return fail(error);
  }
}
