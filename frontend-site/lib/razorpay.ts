import crypto from "node:crypto";

/**
 * Razorpay integration (direct REST — no SDK dependency).
 *
 * Env vars:
 *   RAZORPAY_KEY_ID            — from dashboard.razorpay.com
 *   RAZORPAY_KEY_SECRET        — from dashboard.razorpay.com
 *   NEXT_PUBLIC_RAZORPAY_KEY_ID — same as KEY_ID (safe to expose, it's the client key)
 */

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function basicAuth() {
  return "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
}

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
  status: string;
  receipt?: string | null;
}

/** Creates a payment order. amount is in rupees (converted to paise for Razorpay). */
export async function createRazorpayOrder(opts: {
  amountRupees: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(opts.amountRupees * 100),
      currency: "INR",
      receipt: opts.receipt,
      notes: opts.notes,
    }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Fetches the current status of an order (used by cron reconciliation). */
export async function getRazorpayOrderStatus(orderId: string): Promise<{
  id: string;
  status: string;
  amount_paid: number;
}> {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: basicAuth() },
  });
  if (!res.ok) {
    throw new Error(`Razorpay order lookup failed: ${res.status}`);
  }
  const data = (await res.json()) as { id: string; status: string; amount_paid: number };
  return { id: data.id, status: data.status, amount_paid: data.amount_paid };
}

/** Verifies a checkout signature — the proof that Razorpay really got the money. */
export function verifyPaymentSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest("hex");
  return expected === opts.signature;
}
