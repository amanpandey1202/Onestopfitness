import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

/**
 * GET /api/admin/analytics
 * Returns:
 * - Monthly revenue for the last 12 months
 * - Revenue breakdown by plan
 * - Attendance heat map by hour of day and day of week
 * - Member growth (new members per month for last 12 months)
 */
export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    // Bucket everything in IST (UTC+5:30) so it matches the dashboard timezone.
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);

    // Last 12 calendar months (IST)
    const months: { year: number; month: number; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - i, 1));
      months.push({
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(),
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }),
      });
    }

    // Fetch all PAID payments in last 12 months + plan info
    const twelveMonthsAgo = new Date(
      Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - 11, 1) - IST_OFFSET_MS
    );
    const [payments, allAttendance, newMembers] = await Promise.all([
      prisma.payment.findMany({
        where: { status: "PAID", paidAt: { gte: twelveMonthsAgo } },
        include: { plan: { select: { name: true } } },
      }),
      prisma.attendance.findMany({
        where: { checkIn: { gte: twelveMonthsAgo } },
        select: { checkIn: true },
      }),
      prisma.user.findMany({
        where: { role: "MEMBER", createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
    ]);

    const istOf = (v: Date | null) =>
      v ? new Date(v.getTime() + IST_OFFSET_MS) : null;

    // Monthly revenue
    const monthlyRevenue = months.map(({ year, month, label }) => {
      const total = payments
        .filter((p) => {
          const d = istOf(p.paidAt);
          return d && d.getUTCFullYear() === year && d.getUTCMonth() === month;
        })
        .reduce((sum, p) => sum + p.amount, 0);
      return { label, revenue: total };
    });

    // Revenue by plan
    const revenueByPlan: Record<string, number> = {};
    for (const p of payments) {
      const name = p.plan.name;
      revenueByPlan[name] = (revenueByPlan[name] || 0) + p.amount;
    }

    // Attendance heatmap: buckets by hour (0-23) and day (0=Sun..6=Sat) in IST
    const heatmap: Record<string, number> = {};
    for (const att of allAttendance) {
      const d = istOf(att.checkIn);
      if (!d) continue;
      const day = d.getUTCDay();
      const hour = d.getUTCHours();
      const key = `${day}-${hour}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    }

    // Peak hours: top 5
    const peakHours = Object.entries(heatmap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => {
        const [day, hour] = key.split("-").map(Number);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return {
          day: days[day],
          hour: `${String(hour).padStart(2, "0")}:00`,
          count,
        };
      });

    // New members per month (IST)
    const memberGrowth = months.map(({ year, month, label }) => ({
      label,
      newMembers: newMembers.filter((m) => {
        const d = istOf(m.createdAt);
        return d && d.getUTCFullYear() === year && d.getUTCMonth() === month;
      }).length,
    }));

    // Total revenue
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return ok({
      monthlyRevenue,
      revenueByPlan: Object.entries(revenueByPlan).map(([plan, revenue]) => ({ plan, revenue })),
      peakHours,
      memberGrowth,
      totalRevenue,
      totalPayments: payments.length,
    });
  } catch (e) {
    return fail(e);
  }
}
