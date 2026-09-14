import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { fulfillPaidOrder } from "@/lib/fulfill-paid-order";

/**
 * Razorpay Webhook Handler
 *
 * This endpoint is called directly by Razorpay's servers when a payment succeeds.
 * It ensures that the membership is activated even if the user closes their
 * browser or loses internet connection immediately after paying.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // 2. Verify Webhook Secret
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!secret || secret.length < 12) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is missing, blank, or whitespace-only. " +
          "Set the REAL webhook secret from the Razorpay dashboard in Vercel env + .env - " +
          "the webhook endpoint now refuses all events until it is set correctly."
      );
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3. Parse the event payload
    const event = JSON.parse(rawBody);

    // We only process 'order.paid' or 'payment.captured'
    if (event.event === "order.paid" || event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      if (!orderId) return NextResponse.json({ received: true });

      // Idempotent fulfillment: already-PAID records are left untouched, so a
      // webhook arriving after the browser verify can never double-extend.
      await fulfillPaidOrder({
        orderId,
        paymentId,
        signature: "webhook_verified",
        method: "RAZORPAY",
      });

      console.log(`✅ Webhook successfully fulfilled payment for order: ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}