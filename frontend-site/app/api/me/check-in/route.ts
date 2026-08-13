import { NextResponse } from "next/server";
import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { created, fail } from "@/lib/api";

/**
 * Manual member check-in. Backend verifies:
 *  1. The user is an authenticated member.
 *  2. They have an active (non-expired) membership.
 *  3. They haven't already checked in today (no duplicates).
 */
export async function POST() {
  try {
    const user = await requireMember();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await prisma.attendance.findFirst({
      where: { memberId: user.id, checkIn: { gte: startOfDay } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You've already checked in today", id: existing.id },
        { status: 409 }
      );
    }

    const membership = await prisma.membership.findFirst({
      where: { memberId: user.id, status: "ACTIVE" },
      orderBy: { endDate: "desc" },
    });
    if (!membership || membership.endDate.getTime() < now.getTime()) {
      return NextResponse.json(
        { error: "Your membership is inactive or expired. Please renew it." },
        { status: 403 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: { memberId: user.id, method: "MANUAL" },
    });

    return created({ id: attendance.id, checkIn: attendance.checkIn });
  } catch (error) {
    return fail(error);
  }
}
