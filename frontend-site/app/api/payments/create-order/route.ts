import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";

const bodySchema = z.object({
  planId: z.string().optional(),
  offerId: z.string().optional(),
  memberId: z.string().optional(), // For reminder link or direct payment
});

/**
 * Creates a payment order (Razorpay or Test Mode Fallback) for a plan or offer.
 * Never throws 500 error — if Razorpay keys are missing, seamlessly falls back to Test Mode.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = bodySchema.parse(body);

    // Get current logged in member, or lookup memberId from reminder
    let member = await getSessionUser();
    if (!member && data.memberId) {
      member = await prisma.user.findUnique({ where: { id: data.memberId } });
    }

    if (!member) {
      return NextResponse.json({ error: "Please log in or select a valid member to proceed with payment." }, { status: 401 });
    }

    let planId = data.planId;
    let offer = null;
    let discountAmount = 0;

    if (data.offerId) {
      offer = await prisma.offer.findUnique({ where: { id: data.offerId } });
      if (offer && offer.isActive) {
        if (!planId) {
          // Default to Combo Plan or Weight Training plan if planId not explicitly passed with offer
          const combo = await prisma.membershipPlan.findFirst({ where: { isActive: true } });
          planId = combo?.id;
        }
      }
    }

    if (!planId) {
      return fail(new Error("Please select a membership plan to pay for."));
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return fail(new Error("Selected plan is currently unavailable."));
    }

    let finalPrice = plan.price;
    if (offer && offer.isActive) {
      if (offer.discountType === "PERCENT" && offer.discountValue) {
        discountAmount = Math.round((plan.price * offer.discountValue) / 100);
        finalPrice = Math.max(1, plan.price - discountAmount);
      } else if (offer.discountType === "AMOUNT" && offer.discountValue) {
        discountAmount = Math.min(plan.price - 1, offer.discountValue);
        finalPrice = Math.max(1, plan.price - discountAmount);
      }
    }

    const isTestMode = !razorpayConfigured();
    let orderId: string;

    if (isTestMode) {
      // Demo / Test Mode order ID
      orderId = `order_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    } else {
      const order = await createRazorpayOrder({
        amountRupees: finalPrice,
        receipt: `pay_${Date.now()}`,
        notes: {
          memberId: member.id,
          planId: plan.id,
          planName: plan.name,
          offerId: offer?.id ?? "",
        },
      });
      orderId = order.id;
    }

    await prisma.payment.create({
      data: {
        orderId,
        amount: finalPrice,
        currency: "INR",
        status: "CREATED",
        method: isTestMode ? "TEST_MODE" : "RAZORPAY",
        memberId: member.id,
        planId: plan.id,
      },
    });

    return ok({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
      isTestMode,
      orderId,
      amount: Math.round(finalPrice * 100), // paise
      currency: "INR",
      prefill: {
        name: member.name,
        email: member.email,
        contact: member.phone ?? "",
      },
      plan: { id: plan.id, name: plan.name, originalPrice: plan.price, finalPrice, discountAmount },
      offerTitle: offer?.title ?? null,
    });
  } catch (error) {
    return fail(error);
  }
}
