import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { computeMembershipEndDate } from "@/lib/format";
import { syncMemberToAirtable } from "@/lib/airtable";
import { logAudit } from "@/lib/audit";

const manualPaymentSchema = z.object({
  memberId: z.string().min(1),
  planId: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().default("CASH"), // CASH | UPI | CHEQUE | BANK_TRANSFER
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status"); // PAID | CREATED | FAILED
    const method = url.searchParams.get("method"); // RAZORPAY | CASH | EXCEL_IMPORT | TEST_MODE

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (method) where.method = method;
    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        { paymentId: { contains: search } },
        { member: { name: { contains: search } } },
        { member: { email: { contains: search } } },
        { plan: { name: { contains: search } } },
        { offer: { title: { contains: search } } },
      ];
    }

    // Summary reflects the applied filters (search/status/method), so the KPI
    // cards stay consistent with the table below them.
    const [payments, aggregateTotal, aggregateOnline, aggregateCash, aggregateExcel] =
      await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            member: { select: { id: true, name: true, email: true, phone: true, memberCode: true } },
            plan: { select: { id: true, name: true, price: true } },
            offer: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.payment.aggregate({
          where: { ...where, status: "PAID" },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { ...where, status: "PAID", method: { in: ["RAZORPAY", "ONLINE"] } },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { ...where, status: "PAID", method: { in: ["CASH", "UPI", "CHEQUE", "BANK_TRANSFER", "MANUAL"] } },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { ...where, status: "PAID", method: "EXCEL_IMPORT" },
          _sum: { amount: true },
        }),
      ]);

    return ok({
      payments,
      summary: {
        totalRevenue: aggregateTotal._sum.amount ?? 0,
        onlineRevenue: aggregateOnline._sum.amount ?? 0,
        cashRevenue: aggregateCash._sum.amount ?? 0,
        excelRevenue: aggregateExcel._sum.amount ?? 0,
        totalPaymentsCount: payments.length,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

/** Admin records a manual / cash payment for a member */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = manualPaymentSchema.parse(body);

    const member = await prisma.user.findUnique({ where: { id: data.memberId } });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const plan = await prisma.membershipPlan.findUnique({ where: { id: data.planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const now = new Date();
    const paidAt = data.paidAt ? new Date(data.paidAt) : now;

    // Duration granted scales with the amount actually collected: a partial
    // payment must not extend a full plan duration. Full price ⇒ full duration;
    // otherwise grant a proportional number of days (min 1).
    const fullDays = plan.durationDays;
    const daysGranted =
      data.amount >= plan.price
        ? fullDays
        : Math.max(1, Math.floor((data.amount / plan.price) * fullDays));

    // Extend or create membership atomically (transaction guards against two
    // concurrent POSTs both extending the same base end date).
    const membership = await prisma.$transaction(async (tx) => {
      const existingActive = await tx.membership.findFirst({
        where: { memberId: member.id, status: "ACTIVE", endDate: { gte: now } },
        orderBy: { endDate: "desc" },
      });

      let startDate: Date;
      let endDate: Date;
      let m: { id: string };

      if (existingActive) {
        startDate = existingActive.startDate;
        endDate =
          daysGranted === fullDays
            ? computeMembershipEndDate(existingActive.endDate, fullDays)
            : new Date(existingActive.endDate.getTime() + daysGranted * 86_400_000);
        m = await tx.membership.update({
          where: { id: existingActive.id },
          data: { endDate },
        });
      } else {
        startDate = paidAt;
        endDate =
          daysGranted === fullDays
            ? computeMembershipEndDate(startDate, fullDays)
            : new Date(startDate.getTime() + daysGranted * 86_400_000);
        m = await tx.membership.create({
          data: {
            memberId: member.id,
            planId: plan.id,
            startDate,
            endDate,
            status: "ACTIVE",
          },
        });
      }

      return { ...m, startDate, endDate };
    });

    const startDate = membership.startDate;
    const endDate = membership.endDate;

    const orderId = `manual_${member.id.slice(-6)}_${Date.now()}`;
    const paymentId = `pay_manual_${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        orderId,
        paymentId,
        amount: data.amount,
        currency: "INR",
        status: "PAID",
        method: data.method,
        memberId: member.id,
        planId: plan.id,
        membershipId: membership.id,
        paidAt,
      },
    });

    await prisma.user.update({
      where: { id: member.id },
      data: { isActive: true },
    }).catch(() => {});

    await syncMemberToAirtable({
      name: member.name,
      phone: member.phone,
      email: member.email,
      planName: plan.name,
      amount: data.amount,
      startDate,
      endDate,
    });

    await logAudit(admin.id, "RECORD_MANUAL_PAYMENT", "Payment", payment.id, {
      amount: data.amount,
      method: data.method,
      memberId: member.id,
    });

    return created({ success: true, paymentId: payment.id });
  } catch (error) {
    return fail(error);
  }
}
