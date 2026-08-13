import { NextRequest } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";

const bodySchema = z.object({ planId: z.string().min(1) });

/**
 * Creates a Razorpay order for a plan and stores a PENDING Payment record.
 * Returns what the client checkout needs (key, order_id, amount, prefill).
 */
export async function POST(req: NextRequest) {
  try {
    const member = await requireMember();
    if (!razorpayConfigured()) {
      return fail(new Error("Payments are not configured yet. Contact the gym."));
    }

    const data = bodySchema.parse(await req.json());
    const plan = await prisma.membershipPlan.findUnique({ where: { id: data.planId } });
    if (!plan || !plan.isActive) {
      return fail(new Error("Plan not found"));
    }

    const order = await createRazorpayOrder({
      amountRupees: plan.price,
      receipt: `pay_${Date.now()}`,
      notes: { memberId: member.id, planId: plan.id, planName: plan.name },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: plan.price,
        currency: "INR",
        status: "CREATED",
        memberId: member.id,
        planId: plan.id,
      },
    });

    return ok({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount, // paise
      currency: order.currency,
      prefill: {
        name: member.name,
        email: member.email,
        contact: member.phone ?? "",
      },
      plan: { id: plan.id, name: plan.name, price: plan.price },
    });
  } catch (error) {
    return fail(error);
  }
}
