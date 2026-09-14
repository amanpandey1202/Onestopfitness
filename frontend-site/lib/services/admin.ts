import { Role, type Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { resumeExpiredFreezes } from "@/lib/membership";
import { maskAadhaar } from "@/lib/crypto";
import { isMemberVerified } from "@/lib/memberVerification";
import { site } from "@/data/site";

import type { GalleryImage } from "@/components/admin/gallery/GalleryClient";
import type { Banner } from "@/components/admin/banners/BannersClient";
import type { Announcement } from "@/components/admin/announcements/AnnouncementsClient";
import type { Competition } from "@/components/admin/competitions/CompetitionsClient";
import type { Testimonial } from "@/components/admin/testimonials/TestimonialsClient";
import type { Offer, Plan as OfferPlan } from "@/components/admin/offers/OffersClient";
import type { Plan } from "@/components/admin/plans/PlansClient";
import type { Trainer as AdminTrainer } from "@/components/admin/trainers/TrainersClient";
import type { GymClass } from "@/components/admin/classes/ClassesClient";
import type { Log } from "@/components/admin/audit/AuditClient";
import type { DietPlan } from "@/components/admin/dietPlans/DietPlansClient";

/**
 * Replicates what a Server Component got from `res.json()` on an API route:
 * Dates become ISO strings and undefined keys drop — exactly the shape the
 * admin client components expect (some call `.slice(0, 10)` on date strings).
 */
function jsonData<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Runs a data getter and turns a DB failure into `null` so pages can fall back to empty states. */
export async function safeAdmin<T>(fn: () => Promise<T>, fallback: T = null as T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[admin-ssr]", error);
    return fallback;
  }
}

/* ─── Dashboard ─────────────────────────────────────────────────────────── */

export type AdminStatsPayload = {
  stats: {
    totalMembers: number;
    activeMembers: number;
    todayCheckins: number;
    activeMemberships: number;
    monthlyRevenue: number;
    onlineRevenue?: number;
    cashRevenue?: number;
    excelRevenue?: number;
    upcomingExpiries: number;
    activeOffers?: number;
    publishedCompetitions?: number;
    revenueGrowth: number;
    memberGrowth: number;
    newThisMonth: number;
    absenteeMembers?: number;
    avgChurnRisk?: number;
  };
  revenueTrend: { label: string; value: number }[];
  memberTrend: { label: string; value: number }[];
  heatmap: { date: string; count: number }[];
  recentAudit: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { name: string; email: string } | null;
  }[];
};

export async function getAdminStats(): Promise<AdminStatsPayload> {
  await requireAdmin();

  const now = new Date();
  // IST (UTC+5:30) boundaries — matches the deployed dashboard timezone.
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);

  const istStartOfDayUtc = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate())
  );
  const startOfDay = new Date(istStartOfDayUtc.getTime() - IST_OFFSET_MS);

  const in7Days = new Date(now.getTime() + 7 * 86_400_000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000);

  const istStartOfMonthUtc = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1)
  );
  const startOfMonth = new Date(istStartOfMonthUtc.getTime() - IST_OFFSET_MS);
  const startOfNextMonth = new Date(
    new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() + 1, 1)).getTime() -
      IST_OFFSET_MS
  );

  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - i, 1));
    const endUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - i + 1, 1));
    months.push({
      label: dUtc.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
      start: new Date(dUtc.getTime() - IST_OFFSET_MS),
      end: new Date(endUtc.getTime() - IST_OFFSET_MS),
    });
  }

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
    prisma.user.count({
      where: {
        role: Role.MEMBER,
        attendance: { none: { checkIn: { gte: fourteenDaysAgo } } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.payment.findMany({
      where: { status: "PAID", paidAt: { gte: months[0].start } },
      select: { amount: true, paidAt: true, status: true, method: true },
    }),
    prisma.user.findMany({
      where: { role: Role.MEMBER, createdAt: { gte: months[0].start } },
      select: { createdAt: true },
    }),
    prisma.attendance.findMany({
      where: { checkIn: { gte: ninetyDaysAgo } },
      select: { checkIn: true },
    }),
  ]);

  const revenueTrend = months.map(({ label, start, end }) => {
    const total = allPayments
      .filter((p) => p.paidAt && p.paidAt >= start && p.paidAt < end)
      .reduce((sum, p) => sum + p.amount, 0);
    return { label, value: total };
  });

  const memberTrend = months.map(({ label, start, end }) => ({
    label,
    value: allMemberJoins.filter((m) => m.createdAt >= start && m.createdAt < end).length,
  }));

  const heatmapMap: Record<string, number> = {};
  for (const a of attendanceLast90) {
    const aIst = new Date(a.checkIn.getTime() + IST_OFFSET_MS);
    const key = aIst.toISOString().split("T")[0];
    heatmapMap[key] = (heatmapMap[key] ?? 0) + 1;
  }
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const dIst = new Date(istNow.getTime() - i * 86_400_000);
    heatmap.push({ date: dIst.toISOString().split("T")[0], count: heatmapMap[dIst.toISOString().split("T")[0]] ?? 0 });
  }

  const istLastMonthStartUtc = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - 1, 1)
  );
  const lastMonthStart = new Date(istLastMonthStartUtc.getTime() - IST_OFFSET_MS);

  const lastMonthRevenue = allPayments
    .filter((p) => p.paidAt && p.paidAt >= lastMonthStart && p.paidAt < startOfMonth)
    .reduce((sum, p) => sum + p.amount, 0);
  const thisMonthRevenue = monthlyRevenueResult._sum.amount ?? 0;
  const revenueGrowth =
    lastMonthRevenue === 0 ? 0 : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

  const newThisMonth = allMemberJoins.filter((m) => m.createdAt >= startOfMonth).length;
  const newLastMonth = allMemberJoins.filter(
    (m) => m.createdAt >= lastMonthStart && m.createdAt < startOfMonth
  ).length;
  const memberGrowth =
    newLastMonth === 0 ? (newThisMonth > 0 ? 100 : 0) : Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100);

  const revenueFor = (methods: string[]) =>
    allPayments
      .filter(
        (p) =>
          p.status === "PAID" &&
          p.paidAt &&
          p.paidAt >= startOfMonth &&
          p.paidAt < startOfNextMonth &&
          methods.includes(p.method || "")
      )
      .reduce((sum, p) => sum + p.amount, 0);

  const onlineRevenue = revenueFor(["RAZORPAY", "ONLINE"]);
  const cashRevenue = revenueFor(["CASH", "UPI", "CHEQUE", "BANK_TRANSFER", "MANUAL"]);
  const excelRevenue = revenueFor(["EXCEL_IMPORT"]);

  const avgChurnRisk = totalMembers > 0 ? Math.round((absenteeMembers / totalMembers) * 100) : 0;

  return jsonData({
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
}

export type AdminEngagementPayload = {
  atRisk: {
    memberId: string;
    name: string;
    phone: string | null;
    lastCheckIn: string | null;
    daysSinceLastCheckIn: number;
    membershipStatus: string;
    daysUntilExpiry: number;
    planName: string | null;
    churnRisk: "low" | "medium" | "high";
    alert: "absentee" | "expiry-soon" | "expiry-crossed" | "at-risk" | null;
    summary: string;
    whatsappUrl: string | null;
  }[];
  summary: {
    absentees: number;
    expirySoon: number;
    expiryCrossed: number;
    highRisk: number;
    totalMembers: number;
  };
};

export async function getAdminEngagement(): Promise<AdminEngagementPayload> {
  await requireAdmin();

  const DAY = 86_400_000;
  const now = new Date();
  const nowMs = now.getTime();

  const members = await prisma.user.findMany({
    where: { role: Role.MEMBER, isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      memberships: {
        orderBy: { endDate: "desc" },
        take: 1,
        select: { status: true, endDate: true, plan: { select: { name: true } } },
      },
      attendance: {
        orderBy: { checkIn: "desc" },
        take: 1,
        select: { checkIn: true },
      },
    },
  });

  const atRisk: AdminEngagementPayload["atRisk"] = [];

  for (const member of members) {
    const last = member.attendance[0]?.checkIn ?? member.createdAt;
    const daysSinceLastCheckIn = Math.floor((nowMs - new Date(last).getTime()) / DAY);
    const membership = member.memberships[0] ?? null;
    const endMs = membership?.endDate ? new Date(membership.endDate).getTime() : null;
    const daysUntilExpiry = endMs != null ? Math.ceil((endMs - nowMs) / DAY) : 0;
    const membershipStatus =
      membership?.status === "ACTIVE"
        ? endMs != null && daysUntilExpiry < 0
          ? "EXPIRED"
          : "ACTIVE"
        : "NONE";

    let alert: AdminEngagementPayload["atRisk"][number]["alert"] = null;
    if (membershipStatus === "ACTIVE" && daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
      alert = "expiry-soon";
    }
    if (daysSinceLastCheckIn >= 14) {
      alert = "absentee";
    }
    if (membershipStatus === "EXPIRED" && alert !== "absentee") {
      alert = "expiry-crossed";
    }
    if (alert === null && daysSinceLastCheckIn >= 7) {
      alert = "at-risk";
    }
    if (alert === null) continue;

    const churnRisk: "low" | "medium" | "high" =
      daysSinceLastCheckIn >= 14 || membershipStatus === "EXPIRED"
        ? "high"
        : daysSinceLastCheckIn >= 7 || (daysUntilExpiry >= 0 && daysUntilExpiry <= 7)
          ? "medium"
          : "low";

    const summaryParts: string[] = [];
    if (daysSinceLastCheckIn >= 14) summaryParts.push(`no check-in for ${daysSinceLastCheckIn} days`);
    else if (daysSinceLastCheckIn >= 7) summaryParts.push(`last check-in ${daysSinceLastCheckIn} days ago`);
    if (membershipStatus === "ACTIVE" && daysUntilExpiry <= 7)
      summaryParts.push(`membership ends in ${Math.max(daysUntilExpiry, 0)} day${Math.max(daysUntilExpiry, 0) === 1 ? "" : "s"}`);
    if (membershipStatus === "EXPIRED") summaryParts.push("membership expired");

    const digits = (member.phone ?? "").replace(/\D/g, "");
    const whatsappUrl =
      digits.length >= 10
        ? `https://wa.me/${digits.startsWith("91") ? digits : "91" + digits}?text=${encodeURIComponent(
            site.messages.engagementReach(member.name, summaryParts.join(", "))
          )}`
        : null;

    atRisk.push({
      memberId: member.id,
      name: member.name,
      phone: member.phone,
      lastCheckIn: last ? last.toISOString() : null,
      daysSinceLastCheckIn,
      membershipStatus,
      daysUntilExpiry,
      planName: membership?.plan?.name ?? null,
      churnRisk,
      alert,
      summary: summaryParts.join(" · "),
      whatsappUrl,
    });
  }

  atRisk.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 } as const;
    const r = rank[a.churnRisk] - rank[b.churnRisk];
    if (r !== 0) return r;
    return b.daysSinceLastCheckIn - a.daysSinceLastCheckIn;
  });

  const summary = {
    absentees: atRisk.filter((m) => m.alert === "absentee").length,
    expirySoon: atRisk.filter((m) => m.alert === "expiry-soon").length,
    expiryCrossed: atRisk.filter((m) => m.alert === "expiry-crossed").length,
    highRisk: atRisk.filter((m) => m.churnRisk === "high").length,
    totalMembers: members.length,
  };

  return jsonData({ atRisk, summary });
}

/* ─── Analytics ─────────────────────────────────────────────────────────── */

export type AdminAnalyticsPayload = {
  monthlyRevenue: { label: string; revenue: number }[];
  revenueByPlan: { plan: string; revenue: number }[];
  peakHours: { day: string; hour: string; count: number }[];
  memberGrowth: { label: string; newMembers: number }[];
  totalRevenue: number;
  totalPayments: number;
};

export async function getAdminAnalytics(): Promise<AdminAnalyticsPayload> {
  await requireAdmin();

  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);

  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - i, 1));
    months.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }),
    });
  }

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
      where: { role: Role.MEMBER, createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    }),
  ]);

  const istOf = (v: Date | null) => (v ? new Date(v.getTime() + IST_OFFSET_MS) : null);

  const monthlyRevenue = months.map(({ year, month, label }) => ({
    label,
    revenue: payments
      .filter((p) => {
        const d = istOf(p.paidAt);
        return d && d.getUTCFullYear() === year && d.getUTCMonth() === month;
      })
      .reduce((sum, p) => sum + p.amount, 0),
  }));

  const revenueByPlan: Record<string, number> = {};
  for (const p of payments) {
    const name = p.plan.name;
    revenueByPlan[name] = (revenueByPlan[name] || 0) + p.amount;
  }

  const heatmap: Record<string, number> = {};
  for (const att of allAttendance) {
    const d = istOf(att.checkIn);
    if (!d) continue;
    heatmap[`${d.getUTCDay()}-${d.getUTCHours()}`] = (heatmap[`${d.getUTCDay()}-${d.getUTCHours()}`] || 0) + 1;
  }

  const peakHours = Object.entries(heatmap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [day, hour] = key.split("-").map(Number);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return { day: days[day], hour: `${String(hour).padStart(2, "0")}:00`, count };
    });

  const memberGrowth = months.map(({ year, month, label }) => ({
    label,
    newMembers: newMembers.filter((m) => {
      const d = istOf(m.createdAt);
      return d && d.getUTCFullYear() === year && d.getUTCMonth() === month;
    }).length,
  }));

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return jsonData({
    monthlyRevenue,
    revenueByPlan: Object.entries(revenueByPlan).map(([plan, revenue]) => ({ plan, revenue })),
    peakHours,
    memberGrowth,
    totalRevenue,
    totalPayments: payments.length,
  });
}

/* ─── Members & plans (shared pickers) ──────────────────────────────────── */

export type AdminMembersPayload = {
  members: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    memberCode: string | null;
    isActive: boolean;
    emailVerified: string | null;
    createdAt: string;
    category: "member" | "new";
    isVerified: boolean;
    memberProfile: {
      fitnessGoal: string | null;
      joiningDate: string | null;
      notes: string | null;
      alternatePhone: string | null;
      aadhaarNumber: string | null;
      address: string | null;
      parentName: string | null;
      parentPhone: string | null;
      emergencyContact: string | null;
    } | null;
    memberships: {
      id: string;
      startDate: string;
      endDate: string;
      status: string;
      plan: { id: string; name: string; price: number; durationDays: number };
    }[];
    attendance: { checkIn: string }[];
  }[];
};

export type AdminPlansPayload = {
  plans: Plan[];
};

export async function getAdminMembers(opts: {
  search?: string;
  status?: string;
  category?: string;
} = {}): Promise<AdminMembersPayload> {
  await requireAdmin();
  await resumeExpiredFreezes(prisma);

  const now = new Date();
  const where: Prisma.UserWhereInput = { role: Role.MEMBER };
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search } },
      { email: { contains: opts.search } },
      { phone: { contains: opts.search } },
      { memberCode: { contains: opts.search } },
    ];
  }
  if (opts.status === "suspended") where.isActive = false;
  if (opts.status === "active") where.isActive = true;
  if (opts.status === "expired") {
    where.isActive = true;
    where.memberships = { some: { status: "ACTIVE", endDate: { lt: now } } };
  }
  if (opts.status === "absentee") {
    where.attendance = { none: { checkIn: { gte: new Date(Date.now() - 14 * 86_400_000) } } };
  }
  if (opts.category === "member") {
    where.OR = [
      ...(where.OR ?? []),
      { memberships: { some: {} } },
      { payments: { some: { status: "PAID" } } },
    ];
  } else if (opts.category === "new") {
    where.AND = [
      { memberships: { none: {} } },
      { payments: { none: { status: "PAID" } } },
    ];
  }

  const members = await prisma.user.findMany({
    where,
    include: {
      memberProfile: true,
      memberships: { include: { plan: true }, orderBy: { endDate: "desc" } },
      payments: { where: { status: "PAID" }, select: { id: true }, take: 1 },
      attendance: { orderBy: { checkIn: "desc" }, take: 1, select: { checkIn: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonData({
    members: members.map(({ passwordHash, payments, ...member }) => ({ // eslint-disable-line @typescript-eslint/no-unused-vars
      ...member,
      category: member.memberships.length > 0 || payments.length > 0 ? "member" : "new",
      isVerified: isMemberVerified(member.memberProfile),
      memberProfile: member.memberProfile
        ? {
            ...member.memberProfile,
            aadhaarNumber: maskAadhaar(member.memberProfile.aadhaarNumber),
          }
        : member.memberProfile,
    })),
  });
}

export async function getAdminPlans(): Promise<AdminPlansPayload> {
  await requireAdmin();
  const plans = await prisma.membershipPlan.findMany({ orderBy: { price: "asc" } });
  return jsonData({ plans });
}

/* ─── Payments ──────────────────────────────────────────────────────────── */

export type AdminPaymentsPayload = {
  payments: {
    id: string;
    orderId: string;
    paymentId: string | null;
    amount: number;
    currency: string;
    status: string;
    method: string | null;
    paidAt: string | null;
    createdAt: string;
    member: { id: string; name: string; email: string; phone: string | null; memberCode: string | null };
    plan: { id: string; name: string; price: number };
    offer?: { id: string; title: string } | null;
  }[];
  summary: {
    totalRevenue: number;
    onlineRevenue: number;
    cashRevenue: number;
    excelRevenue: number;
    totalPaymentsCount: number;
  };
};

export async function getAdminPayments(opts: {
  search?: string;
  status?: string;
  method?: string;
} = {}): Promise<AdminPaymentsPayload> {
  await requireAdmin();

  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  if (opts.method) where.method = opts.method;
  if (opts.search) {
    where.OR = [
      { orderId: { contains: opts.search } },
      { paymentId: { contains: opts.search } },
      { member: { name: { contains: opts.search } } },
      { member: { email: { contains: opts.search } } },
      { plan: { name: { contains: opts.search } } },
      { offer: { title: { contains: opts.search } } },
    ];
  }

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
      prisma.payment.aggregate({ where: { ...where, status: "PAID" }, _sum: { amount: true } }),
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

  return jsonData({
    payments,
    summary: {
      totalRevenue: aggregateTotal._sum.amount ?? 0,
      onlineRevenue: aggregateOnline._sum.amount ?? 0,
      cashRevenue: aggregateCash._sum.amount ?? 0,
      excelRevenue: aggregateExcel._sum.amount ?? 0,
      totalPaymentsCount: payments.length,
    },
  });
}

/* ─── Content sections (banners → audit) ────────────────────────────────── */

export async function getAdminGallery(): Promise<{ images: GalleryImage[] }> {
  await requireAdmin();
  const images = await prisma.galleryImage.findMany({ orderBy: { createdAt: "desc" } });
  return jsonData({ images });
}

export async function getAdminBanners(): Promise<{ banners: Banner[] }> {
  await requireAdmin();
  const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
  return jsonData({ banners });
}

export async function getAdminAnnouncements(): Promise<{ announcements: Announcement[] }> {
  await requireAdmin();
  const announcements = await prisma.announcement.findMany({ orderBy: { publishAt: "desc" } });
  return jsonData({ announcements });
}

export async function getAdminCompetitions(): Promise<{ competitions: Competition[] }> {
  await requireAdmin();
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true } } },
  });
  return jsonData({ competitions });
}

export async function getAdminTestimonials(): Promise<{ testimonials: Testimonial[] }> {
  await requireAdmin();
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
  return jsonData({ testimonials });
}

export async function getAdminOffers(): Promise<{ offers: Offer[]; planOptions: OfferPlan[] }> {
  await requireAdmin();
  const [offers, planOptions] = await Promise.all([
    prisma.offer.findMany({
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { id: true, name: true } } },
    }),
    prisma.membershipPlan.findMany({ orderBy: { price: "asc" }, select: { id: true, name: true } }),
  ]);
  return jsonData({ offers, planOptions });
}

export async function getAdminTrainers(): Promise<{ trainers: AdminTrainer[] }> {
  await requireAdmin();
  const trainers = await prisma.user.findMany({
    where: { OR: [{ role: Role.TRAINER }, { trainerProfile: { isNot: null } }] },
    include: { trainerProfile: true },
    orderBy: { createdAt: "desc" },
  });
  return jsonData({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    trainers: trainers.map(({ passwordHash, ...trainer }) => trainer),
  });
}

export async function getAdminClasses(): Promise<{ classes: GymClass[] }> {
  await requireAdmin();
  const classes = await prisma.classSchedule.findMany({
    where: { isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: { _count: { select: { bookings: true } } },
  });
  return jsonData({ classes });
}

export async function getAdminDietPlans(memberId?: string): Promise<{ plans: DietPlan[] }> {
  await requireAdmin();
  const plans = await prisma.dietPlan.findMany({
    where: memberId ? { memberId } : undefined,
    include: {
      meals: { orderBy: { orderIndex: "asc" } },
      member: { select: { id: true, name: true, memberCode: true } },
      trainer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return jsonData({ plans });
}

export async function getAdminAuditLogs(limit = 50): Promise<{ logs: Log[] }> {
  await requireAdmin();
  const take = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 200) : 50;
  const logs = await prisma.auditLog.findMany({
    where: {},
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { name: true, email: true, role: true } },
    },
  });
  return jsonData({ logs });
}