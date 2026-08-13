import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * QR Check-in Endpoint
 *
 * HOW IT WORKS:
 * 1. Each member has a unique `qrToken` on their User record.
 * 2. The member portal shows a QR code encoding the URL:
 *    https://yourgym.com/checkin?token=<qrToken>
 * 3. Staff (or the member themselves) scans this QR with any camera app.
 * 4. The phone opens this URL in the browser — no app needed.
 * 5. This endpoint verifies the token + active membership, logs attendance as "QR".
 *
 * UNIVERSAL QR: One QR per member, never changes. The gym can also print a
 * member's QR on their membership card. The URL is the gym itself — no external
 * scanner app required. Any camera works.
 *
 * SECURITY: The token is a 32-byte random hex string (256-bit entropy).
 * Guessing it is computationally infeasible. If compromised, admin can reset
 * it from the members page.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await ctx.params;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find user by QR token
    const user = await prisma.user.findUnique({ where: { qrToken: token } });
    if (!user || !user.isActive || user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "Invalid or expired QR code. Ask at the front desk." },
        { status: 404 }
      );
    }

    // Check membership is active and not expired
    const membership = await prisma.membership.findFirst({
      where: { memberId: user.id, status: "ACTIVE", endDate: { gte: now } },
      orderBy: { endDate: "desc" },
      include: { plan: true },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: "Membership expired or inactive.",
          memberName: user.name,
          memberId: user.id,
          alreadyCheckedIn: false,
          success: false,
        },
        { status: 403 }
      );
    }

    // Prevent double check-in on the same calendar day
    const existing = await prisma.attendance.findFirst({
      where: { memberId: user.id, checkIn: { gte: startOfDay } },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        memberName: user.name,
        memberCode: user.memberCode,
        checkInTime: existing.checkIn.toISOString(),
        planName: membership.plan.name,
        daysRemaining: Math.ceil((membership.endDate.getTime() - now.getTime()) / 86_400_000),
      });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: { memberId: user.id, method: "QR", checkIn: now },
    });

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: false,
      memberName: user.name,
      memberCode: user.memberCode,
      checkInTime: attendance.checkIn.toISOString(),
      planName: membership.plan.name,
      daysRemaining: Math.ceil((membership.endDate.getTime() - now.getTime()) / 86_400_000),
    });
  } catch (error) {
    console.error("[QR check-in]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
