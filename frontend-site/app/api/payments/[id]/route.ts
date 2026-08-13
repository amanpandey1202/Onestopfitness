import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser();

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        plan: true,
        member: { select: { id: true, name: true, email: true, phone: true, memberCode: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment receipt not found" }, { status: 404 });
    }

    // Security check — allow if admin or if member owns the payment
    if (user && user.role !== "ADMIN" && user.id !== payment.memberId) {
      return NextResponse.json({ error: "Unauthorized access to receipt" }, { status: 403 });
    }

    let membership = null;
    if (payment.membershipId) {
      membership = await prisma.membership.findUnique({
        where: { id: payment.membershipId },
      });
    }

    return ok({ payment, membership });
  } catch (error) {
    return fail(error);
  }
}
