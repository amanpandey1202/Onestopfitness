import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/api";

/** HTML-escape a value before interpolating it into the receipt markup (prevents stored/reflected XSS). */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * GET /api/me/payments/receipt?orderId=xxx
 * Returns an HTML receipt page that can be printed or saved as PDF.
 * No external PDF library needed — browser print dialog handles it.
 */
export async function GET(req: NextRequest) {
  try {
    const member = await requireMember();
    const orderId = new URL(req.url).searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { plan: true, member: { select: { name: true, email: true, phone: true, memberCode: true } } },
    });

    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (payment.memberId !== member.id) return NextResponse.json({ error: "Not your receipt" }, { status: 403 });
    if (payment.status !== "PAID") return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 });

    const paidAt = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    }) : "—";

    const membership = payment.membershipId
      ? await prisma.membership.findUnique({ where: { id: payment.membershipId } })
      : null;

    const startDate = membership?.startDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) ?? "—";
    const endDate = membership?.endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) ?? "—";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Receipt — ONE STOP FITNESS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; padding: 40px 20px; max-width: 520px; margin: 0 auto; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .logo span { color: #6bba00; }
    .receipt-title { margin-top: 24px; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #666; }
    h1 { font-size: 28px; font-weight: 800; margin-top: 4px; }
    .divider { border: none; border-top: 2px solid #6bba00; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .row .label { color: #777; }
    .row .value { font-weight: 600; }
    .amount-row { display: flex; justify-content: space-between; padding: 14px 0; font-size: 20px; font-weight: 800; border-top: 2px solid #111; margin-top: 8px; }
    .amount-row .amt { color: #6bba00; }
    .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
    .paid-badge { display: inline-block; background: #e8fae0; color: #2d7a00; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    @media print { body { padding: 20px; } button { display: none; } }
  </style>
</head>
<body>
  <div class="logo">ONE STOP <span>FITNESS</span></div>
  <p style="font-size:12px;color:#999;margin-top:4px">Rajajipuram, Lucknow · onestopfit.in</p>

  <div class="receipt-title">Membership Receipt</div>
  <h1>Thank you, ${esc(payment.member.name.split(" ")[0])}!</h1>
  <span class="paid-badge">✓ PAID</span>

  <hr class="divider">

  <div class="row"><span class="label">Member Name</span><span class="value">${esc(payment.member.name)}</span></div>
  <div class="row"><span class="label">Member ID</span><span class="value">${esc(payment.member.memberCode ?? "—")}</span></div>
  <div class="row"><span class="label">Email</span><span class="value">${esc(payment.member.email)}</span></div>
  ${payment.member.phone ? `<div class="row"><span class="label">Phone</span><span class="value">${esc(payment.member.phone)}</span></div>` : ""}
  <div class="row"><span class="label">Plan</span><span class="value">${esc(payment.plan.name)}</span></div>
  <div class="row"><span class="label">Valid From</span><span class="value">${startDate}</span></div>
  <div class="row"><span class="label">Valid Until</span><span class="value">${endDate}</span></div>
  <div class="row"><span class="label">Paid On</span><span class="value">${paidAt}</span></div>
  <div class="row"><span class="label">Payment ID</span><span class="value" style="font-size:11px;font-family:monospace">${esc(payment.paymentId ?? "—")}</span></div>
  <div class="row"><span class="label">Order ID</span><span class="value" style="font-size:11px;font-family:monospace">${esc(payment.orderId)}</span></div>

  <div class="amount-row">
    <span>Total Paid</span>
    <span class="amt">₹${payment.amount.toLocaleString("en-IN")}</span>
  </div>

  <div class="footer">
    <p>This is a computer-generated receipt. No signature required.</p>
    <p style="margin-top:8px">Questions? WhatsApp: +91-92369-58881</p>
  </div>

  <div style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="background:#6bba00;color:#fff;border:none;padding:10px 24px;font-size:14px;font-weight:700;border-radius:8px;cursor:pointer">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return fail(e);
  }
}
