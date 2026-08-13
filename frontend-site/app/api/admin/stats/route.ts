import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    // Calculate boundaries strictly in IST (UTC+5:30) to prevent server timezone offsets
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);

    // Midnight IST today converted to UTC for DB query
    const istStartOfDayUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()));
    const startOfDay = new Date(istStartOfDayUtc.getTime() - IST_OFFSET_MS);

    const in7Days = new Date(now.getTime() + 7 * 86_400_000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000);

    // Month boundaries IST
    const istStartOfMonthUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1));
    const startOfMonth = new Date(istStartOfMonthUtc.getTime() - IST_OFFSET_MS);

    const istStartOfNextMonthUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() + 1, 1));
    const startOfNextMonth = new Date(istStartOfNextMonthUtc.getTime() - IST_OFFSET_MS);

    // Build last 6 months boundaries for trend data in IST
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - i, 1));
      const endUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - i + 1, 1));
      const dIst = new Date(dUtc.getTime() - IST_OFFSET_MS);
      const endIst = new Date(endUtc.getTime() - IST_OFFSET_MS);
      months.push({
        label: dUtc.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
        start: dIst,
        end: endIst,
      });
    }

    // Build last 90 days for heatmap
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);

    const [
      totalMembers,
      activeMembers,
      todayCheckins,
      activeMemberships,
      upcomingExpiries,
      activeOffers,
      publishedCompetitions,
      monthlyRevenueResult,
      absenteeMembers,
      recentAudit,
      allPayments,
      allMemberJoins,
      attendanceLast90,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.MEMBER } }),
      prisma.user.count({ where: { role: Role.MEMBER, isActive: true } }),
      prisma.attendance.count({ where: { checkIn: { gte: startOfDay } } }),
      prisma.membership.count({ where: { status: "ACTIVE", endDate: { gte: now } } }),
      prisma.membership.count({ where: { status: "ACTIVE", endDate: { gte: now, lte: in7Days } } }),
      prisma.offer.count({ where: { isActive: true } }),
      prisma.competition.count({ where: { status: "PUBLISHED" } }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth, lt: startOfNextMonth } },
        _sum: { amount: true },
      }),
      // Count active members with no check-in in last 14 days
      prisma.user.count({
        where: {
          role: Role.MEMBER,
          isActive: true,
          attendance: {
            none: {
              checkIn: { gte: fourteenDaysAgo },
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { actor: { select: { name: true, email: true } } },
      }),
      // All paid payments for the last 6 months for trend
      prisma.payment.findMany({
        where: { status: "PAID", paidAt: { gte: months[0].start } },
        select: { amount: true, paidAt: true, status: true, method: true },
      }),
      // All member join dates for trend
      prisma.user.findMany({
        where: { role: Role.MEMBER, createdAt: { gte: months[0].start } },
        select: { createdAt: true },
      }),
      // Attendance records last 90 days for heatmap
      prisma.attendance.findMany({
        where: { checkIn: { gte: ninetyDaysAgo } },
        select: { checkIn: true },
      }),
    ]);

    // Revenue trend — aggregate per month
    const revenueTrend = months.map(({ label, start, end }) => {
      const total = allPayments
        .filter((p) => p.paidAt && p.paidAt >= start && p.paidAt < end)
        .reduce((sum, p) => sum + p.amount, 0);
      return { label, value: total };
    });

    // Member growth trend
    const memberTrend = months.map(({ label, start, end }) => {
      const count = allMemberJoins.filter(
        (m) => m.createdAt >= start && m.createdAt < end
      ).length;
      return { label, value: count };
    });

    // Check-in heatmap — count per day for last 90 days in IST
    const heatmapMap: Record<string, number> = {};
    for (const a of attendanceLast90) {
      const aIst = new Date(a.checkIn.getTime() + IST_OFFSET_MS);
      const key = aIst.toISOString().split("T")[0]; // "2026-08-12"
      heatmapMap[key] = (heatmapMap[key] ?? 0) + 1;
    }

    // Fill in all 90 days (0 if no check-ins)
    const heatmap: { date: string; count: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const dIst = new Date(istNow.getTime() - i * 86_400_000);
      const key = dIst.toISOString().split("T")[0];
      heatmap.push({ date: key, count: heatmapMap[key] ?? 0 });
    }

    // Last month comparison for % change
    const istLastMonthStartUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - 1, 1));
    const lastMonthStart = new Date(istLastMonthStartUtc.getTime() - IST_OFFSET_MS);

    const lastMonthRevenue = allPayments
      .filter((p) => p.paidAt && p.paidAt >= lastMonthStart && p.paidAt < startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);
    const thisMonthRevenue = monthlyRevenueResult._sum.amount ?? 0;
    const revenueGrowth =
      lastMonthRevenue === 0
        ? 100
        : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

    // Members last month vs this month
    const newThisMonth = allMemberJoins.filter(
      (m) => m.createdAt >= startOfMonth
    ).length;
    const newLastMonth = allMemberJoins.filter(
      (m) => m.createdAt >= lastMonthStart && m.createdAt < startOfMonth
    ).length;
    const memberGrowth =
      newLastMonth === 0
        ? (newThisMonth > 0 ? 100 : 0)
        : Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100);

    // Revenue breakdown by method
    const onlineRevenue = allPayments
      .filter((p) => p.status === "PAID" && p.paidAt && p.paidAt >= startOfMonth && p.paidAt < startOfNextMonth && ["RAZORPAY", "ONLINE"].includes(p.method || ""))
      .reduce((sum, p) => sum + p.amount, 0);

    const cashRevenue = allPayments
      .filter((p) => p.status === "PAID" && p.paidAt && p.paidAt >= startOfMonth && p.paidAt < startOfNextMonth && ["CASH", "UPI", "CHEQUE", "BANK_TRANSFER", "MANUAL"].includes(p.method || ""))
      .reduce((sum, p) => sum + p.amount, 0);

    const excelRevenue = allPayments
      .filter((p) => p.status === "PAID" && p.paidAt && p.paidAt >= startOfMonth && p.paidAt < startOfNextMonth && p.method === "EXCEL_IMPORT")
      .reduce((sum, p) => sum + p.amount, 0);

    const avgChurnRisk = activeMembers > 0 ? Math.round((absenteeMembers / activeMembers) * 100) : 0;

    return ok({
      stats: {
        totalMembers,
        activeMembers,
        todayCheckins,
        activeMemberships,
        monthlyRevenue: thisMonthRevenue,
        onlineRevenue,
        cashRevenue,
        excelRevenue,
        upcomingExpiries,
        activeOffers,
        publishedCompetitions,
        revenueGrowth,
        memberGrowth,
        newThisMonth,
        absenteeMembers,
        avgChurnRisk,
      },
      revenueTrend,
      memberTrend,
      heatmap,
      recentAudit,
    });
  } catch (error) {
    return fail(error);
  }
}
