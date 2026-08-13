import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { fail } from "@/lib/api";
import { predictEngagement, analyzeAbsenteeMember } from "@/lib/gemini";

/**
 * GET /api/ai?action=predict&memberId=xxx
 * GET /api/ai?action=absentees&memberId=xxx
 * GET /api/ai?action=membership-alerts
 * All routes require ADMIN role.
 */
export async function GET(req: NextRequest) {
  try {
    // Fix #4: requireAdmin() throws HttpError on failure, never returns NextResponse.
    // The try/catch + fail() in this wrapper handles it correctly.
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "analyze";

    switch (action) {
      case "predict":
        return await handlePredictEngagement(searchParams);
      case "absentees":
        return await handleAbsenteeAnalysis(searchParams);
      case "membership-alerts":
        return await handleMembershipAlerts();
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: predict, absentees, membership-alerts" },
          { status: 400 }
        );
    }
  } catch (error) {
    return fail(error);
  }
}

/**
 * Fix #5: Was calling req.json() on a GET request — body is always empty on GET.
 * Now reads memberId from searchParams.
 * Fix #3: Passes the real last check-in date, not null.
 */
async function handlePredictEngagement(searchParams: URLSearchParams) {
  const memberId = searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "memberId query param is required" }, { status: 400 });
  }

  const now = new Date();

  const [member, memberships, attendanceHistory] = await Promise.all([
    prisma.user.findUnique({
      where: { id: memberId },
      include: { memberProfile: true },
    }),
    prisma.membership.findMany({
      where: { memberId },
      orderBy: { endDate: "desc" },
      include: { plan: true },
    }),
    prisma.attendance.findMany({
      where: { memberId },
      orderBy: { checkIn: "desc" },
      take: 30,
    }),
  ]);

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const latestMembership = memberships[0];
  const membershipEndDate = latestMembership?.endDate
    ? new Date(latestMembership.endDate)
    : null;

  // Real last check-in date from actual attendance records
  const lastCheckIn = attendanceHistory[0]?.checkIn
    ? new Date(attendanceHistory[0].checkIn)
    : null;

  const daysSinceLastCheckIn = lastCheckIn
    ? Math.ceil((now.getTime() - lastCheckIn.getTime()) / 86_400_000)
    : 999;

  const checkInHistory = attendanceHistory.map((a) => new Date(a.checkIn));

  const prediction = await predictEngagement(
    memberId,
    checkInHistory,
    membershipEndDate,
    daysSinceLastCheckIn,
    checkInHistory.length
  );

  // Attach real member name to the result
  return NextResponse.json({ prediction: { ...prediction, name: member.name } });
}

async function handleAbsenteeAnalysis(searchParams: URLSearchParams) {
  const memberId = searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "memberId query param is required" }, { status: 400 });
  }

  const member = await prisma.user.findUnique({
    where: { id: memberId },
    include: {
      memberProfile: true,
      memberships: {
        include: { plan: true },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const checkInHistory = await prisma.attendance.findMany({
    where: { memberId, checkIn: { gte: thirtyDaysAgo } },
    orderBy: { checkIn: "desc" },
  });

  // Fix #3: Pass the real last check-in, not null from joiningDate branch.
  const latestCheckIn = checkInHistory[0]?.checkIn ?? null;

  const latestMembership = member.memberships[0];
  const membership = latestMembership
    ? {
        status: latestMembership.status,
        endDate: latestMembership.endDate,
        plan: { price: latestMembership.plan.price },
      }
    : { status: "EXPIRED" as const, endDate: null, plan: { price: 0 } };

  const analysis = await analyzeAbsenteeMember(
    memberId,
    member.name || "Member",
    latestCheckIn ? new Date(latestCheckIn) : null,
    membership,
    checkInHistory.map((a) => ({ checkIn: new Date(a.checkIn) }))
  );

  return NextResponse.json({ analysis });
}

async function handleMembershipAlerts() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86_400_000);
  const in14Days = new Date(now.getTime() + 14 * 86_400_000);

  const expiringMemberships = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { endDate: { gte: now, lte: in7Days } },
        { endDate: { gte: in7Days, lte: in14Days } },
      ],
    },
    include: {
      member: { include: { memberProfile: true } },
      plan: true,
    },
    orderBy: { endDate: "asc" },
  });

  // Members with their last check-in before the 14-day threshold
  const lastCheckInThreshold = new Date(now.getTime() - 14 * 86_400_000);

  const absentMembers = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      isActive: true,
      memberships: { some: { status: "ACTIVE", endDate: { gte: now } } },
    },
    include: {
      attendance: { orderBy: { checkIn: "desc" }, take: 1 },
      memberships: {
        where: { status: "ACTIVE" },
        include: { plan: true },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });

  const absenteeAnalysis = absentMembers
    .map((m) => {
      const lastAttendance = m.attendance[0];
      if (!lastAttendance || new Date(lastAttendance.checkIn) >= lastCheckInThreshold) {
        return null; // checked in recently
      }
      const latestMembership = m.memberships[0];
      const daysSinceLastCheckIn = Math.ceil(
        (now.getTime() - new Date(lastAttendance.checkIn).getTime()) / 86_400_000
      );
      const daysUntilExpiry = latestMembership?.endDate
        ? Math.max(0, Math.ceil((new Date(latestMembership.endDate).getTime() - now.getTime()) / 86_400_000))
        : 0;

      let messageTemplate: "absentee" | "expiry-soon" | "expiry-crossed" = "absentee";
      let churnRisk: "low" | "medium" | "high" = "low";

      if (daysUntilExpiry <= 7) messageTemplate = "expiry-soon";
      if (daysUntilExpiry <= 0) messageTemplate = "expiry-crossed";
      if (daysSinceLastCheckIn >= 14) churnRisk = "high";
      else if (daysSinceLastCheckIn >= 7) churnRisk = "medium";

      return {
        memberId: m.id,
        name: m.name,
        daysSinceLastCheckIn,
        membershipStatus: "ACTIVE",
        daysUntilExpiry,
        planName: latestMembership?.plan.name ?? null,
        planPrice: latestMembership?.plan.price ?? 0,
        messageTemplate,
        churnRisk,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.daysSinceLastCheckIn - a!.daysSinceLastCheckIn));

  return NextResponse.json({ absenteeAnalysis, expiringMemberships });
}
