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
      ];
    }

    const [payments, aggregateTotal, aggregateOnline, aggregateCash, aggregateExcel] =
      await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            member: { select: { id: true, name: true, email: true, phone: true, memberCode: true } },
            plan: { select: { id: true, name: true, price: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.payment.aggregate({
          where: { status: "PAID" },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { status: "PAID", method: { in: ["RAZORPAY", "ONLINE"] } },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { status: "PAID", method: { in: ["CASH", "UPI", "CHEQUE", "BANK_TRANSFER", "MANUAL"] } },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { status: "PAID", method: "EXCEL_IMPORT" },
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

    // Extend or create membership
    const existingActive = await prisma.membership.findFirst({
      where: { memberId: member.id, status: "ACTIVE", endDate: { gte: now } },
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
      startDate = paidAt;
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
