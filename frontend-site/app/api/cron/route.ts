import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendExpiryWarningEmail } from "@/lib/email";
import { fulfillPaidOrder } from "@/lib/fulfill-paid-order";
import { getRazorpayOrderStatus } from "@/lib/razorpay";

const EXPIRY_REMINDER_WINDOW_DAYS = 3;
const STALE_CREATED_MS = 2 * 60 * 60 * 1000; // reconcile CREATED orders older than 2h

/**
 * GET /api/cron
 * Daily maintenance job.
 *  1. Deletes expired sessions from the DB to prevent unbounded growth.
 *  2. Auto-resumes expired frozen memberships.
 *  3. Reconciles stale CREATED Razorpay orders (paid at Razorpay but the client
 *     never hit /api/payments/verify) by querying Razorpay and fulfilling/FAILED.
 *  4. Sends expiry-reminder emails for memberships ending within 3 days.
 *
 * Wired via vercel.json ("path": "/api/cron", "schedule": "0 22 * * *" → 03:30 IST).
 * Auth: Authorization: Bearer <CRON_SECRET>
 */
export const maxDuration = 60;
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 401 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  // Also auto-resume any frozen memberships that have passed their freezeEndsAt date
  const frozenMemberships = await prisma.membership.findMany({
    where: {
      status: "FROZEN",
      freezeEndsAt: { lte: now },
    },
  });

  let resumedCount = 0;
  for (const mem of frozenMemberships) {
    if (!mem.frozenAt) continue;
    const frozenDays = Math.ceil(
      (now.getTime() - new Date(mem.frozenAt).getTime()) / 86_400_000
    );
    const newEndDate = new Date(
      new Date(mem.endDate).getTime() + frozenDays * 86_400_000
    );
    await prisma.membership.update({
      where: { id: mem.id },
      data: {
        status: "ACTIVE",
        endDate: newEndDate,
        frozenAt: null,
        freezeEndsAt: null,
        totalFrozenDays: mem.totalFrozenDays + frozenDays,
      },
    });
    resumedCount++;
  }

  // Reconcile stale CREATED Razorpay orders: if Razorpay actually has the money
  // (payment made but the browser never verified), fulfill the membership; if
  // the order was never paid, mark it FAILED. Per-item error handling so one bad
  // order never aborts the run. TEST_MODE rows are never queried against Razorpay.
  const stale = await prisma.payment.findMany({
    where: {
      status: "CREATED",
      method: "RAZORPAY",
      createdAt: { lt: new Date(Date.now() - STALE_CREATED_MS) },
    },
    select: { id: true, orderId: true },
  });

  let reconciledPaid = 0;
  let reconciledFailed = 0;
  for (const p of stale) {
    try {
      const order = await getRazorpayOrderStatus(p.orderId);
      if (order.amount_paid > 0) {
        const r = await fulfillPaidOrder({ orderId: p.orderId, method: "RAZORPAY" });
        if ("fulfilled" in r) reconciledPaid++;
      } else {
        await prisma.payment.update({
          where: { id: p.id },
          data: { status: "FAILED" },
        });
        reconciledFailed++;
      }
    } catch (err) {
      console.error(`[cron:reconcile] order ${p.orderId}`, err);
    }
  }

  // Send expiry reminders for ACTIVE memberships ending within the window.
  // Fires only while exactly 1-3 days remain, so a daily cron reminds at most once.
  const windowEnd = new Date(now.getTime() + EXPIRY_REMINDER_WINDOW_DAYS * 86_400_000);
  const expiringMemberships = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: now, lte: windowEnd },
    },
    include: { member: true, plan: true },
  });

  let reminderEmails = 0;
  for (const mem of expiringMemberships) {
    if (!mem.member.isActive) continue;
    const daysLeft = Math.ceil(
      (new Date(mem.endDate).getTime() - now.getTime()) / 86_400_000
    );
    if (daysLeft < 1 || daysLeft > EXPIRY_REMINDER_WINDOW_DAYS) continue;
    const sent = await sendExpiryWarningEmail(
      mem.member.email,
      mem.member.name,
      mem.plan.name,
      daysLeft
    );
    if (sent) reminderEmails++;
  }

  return NextResponse.json({
    success: true,
    expiredSessionsDeleted: result.count,
    membershipsAutoResumed: resumedCount,
    paymentsReconciledPaid: reconciledPaid,
    paymentsReconciledFailed: reconciledFailed,
    remindersSent: reminderEmails,
    ranAt: now.toISOString(),
  });
}
