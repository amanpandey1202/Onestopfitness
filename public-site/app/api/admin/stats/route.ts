import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7Days = new Date(now.getTime() + 7 * 86_400_000);

    // Calendar-month boundaries for revenue — Jan 1 00:00 to Feb 1 00:00, etc.
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalMembers,
      activeMembers,
      todayCheckins,
      activeMemberships,
      upcomingExpiries,
      activeOffers,
      publishedCompetitions,
      monthlyRevenueResult,
      recentAudit,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.MEMBER } }),
      prisma.user.count({ where: { role: Role.MEMBER, isActive: true } }),
      prisma.attendance.count({ where: { checkIn: { gte: startOfDay } } }),
      prisma.membership.count({
        where: { status: "ACTIVE", endDate: { gte: now } },
      }),
      prisma.membership.count({
        where: { status: "ACTIVE", endDate: { gte: now, lte: in7Days } },
      }),
      prisma.offer.count({ where: { isActive: true } }),
      prisma.competition.count({ where: { status: "PUBLISHED" } }),
      // Fix #30: sum of PAID payment amounts this calendar month — actual revenue
      prisma.payment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
        _sum: { amount: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { name: true, email: true } } },
      }),
    ]);

    return ok({
      stats: {
        totalMembers,
        activeMembers,
        todayCheckins,
        activeMemberships,
        // Real money collected this calendar month from Razorpay-verified payments
        monthlyRevenue: monthlyRevenueResult._sum.amount ?? 0,
        upcomingExpiries,
        activeOffers,
        publishedCompetitions,
      },
      recentAudit,
    });
  } catch (error) {
    return fail(error);
  }
}
