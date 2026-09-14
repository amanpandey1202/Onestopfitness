import { prisma } from "@/lib/db";
import { parseFeatures, getPublishedAnnouncements } from "@/lib/services/public";
import { isMemberVerified } from "@/lib/memberVerification";

/**
 * Assembles everything a member's dashboard needs in one query.
 * Effective membership status is computed from dates, not just the stored flag:
 *  - endDate passed  → EXPIRED (even if the row still says FROZEN — a lapsed
 *    freeze is not a free pass)
 *  - otherwise the stored status is kept (FROZEN / SUSPENDED / CANCELLED / ACTIVE)
 */
export async function getMemberDashboard(memberId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const [
    user,
    profile,
    membershipRow,
    attendanceCount,
    todayCheckIn,
    latestPlan,
    joinedCompetitions,
    recentAttendance,
    dietPlan,
    measurements,
    todaysClasses,
    todaysClassBookings,
    monthVisits,
    weekAttendance,
    announcements,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: memberId },
      include: { memberProfile: true },
    }),
    prisma.memberProfile.findUnique({ where: { userId: memberId } }),
    prisma.membership.findFirst({
      where: { memberId },
      orderBy: { endDate: "desc" },
      include: { plan: true },
    }),
    prisma.attendance.count({ where: { memberId } }),
    prisma.attendance.findFirst({
      where: {
        memberId,
        checkIn: { gte: startOfToday },
      },
      orderBy: { checkIn: "desc" },
    }),
    prisma.workoutPlan.findFirst({
      where: { memberId },
      orderBy: { updatedAt: "desc" },
      include: { exercises: { orderBy: { orderIndex: "asc" } }, trainer: { select: { name: true } } },
    }),
    prisma.competitionParticipant.findMany({
      where: { memberId },
      include: { competition: true },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.attendance.findMany({
      where: { memberId },
      orderBy: { checkIn: "desc" },
      take: 14,
    }),
    // Phase 1 — latest active diet plan
    prisma.dietPlan.findFirst({
      where: { memberId, isActive: true },
      orderBy: { updatedAt: "desc" },
      include: {
        meals: { orderBy: { orderIndex: "asc" } },
        trainer: { select: { name: true } },
      },
    }),
    // Phase 1 — last 2 body measurements (for delta + mini chart)
    prisma.bodyMeasurement.findMany({
      where: { memberId },
      orderBy: { recordedAt: "desc" },
      take: 2,
    }),
    // Phase 1 — today's classes by weekday
    prisma.classSchedule.findMany({
      where: { isActive: true, dayOfWeek: now.getDay() },
      orderBy: { startTime: "asc" },
    }),
    // Phase 1 — the member's confirmed bookings for today (which classes are theirs)
    prisma.classBooking.findMany({
      where: { memberId, classDate: { gte: startOfToday, lt: startOfTomorrow }, status: "CONFIRMED" },
      select: { classScheduleId: true },
    }),
    // Phase 1 — visits this calendar month
    prisma.attendance.count({ where: { memberId, checkIn: { gte: startOfMonth } } }),
    // Phase 1 — raw check-ins for the last 7 days (aggregated in JS)
    prisma.attendance.findMany({
      where: { memberId, checkIn: { gte: sevenDaysAgo } },
      select: { checkIn: true },
    }),
    getPublishedAnnouncements(),
  ]);

  let membership = null;
  if (membershipRow) {
    const status =
      membershipRow.endDate.getTime() < now.getTime() ? "EXPIRED" : membershipRow.status;
    const endDay = Date.UTC(membershipRow.endDate.getFullYear(), membershipRow.endDate.getMonth(), membershipRow.endDate.getDate());
    const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysRemaining = Math.max(0, Math.round((endDay - todayDay) / 86_400_000));
    membership = {
      id: membershipRow.id,
      plan: { ...membershipRow.plan, features: parseFeatures(membershipRow.plan.features) },
      startDate: membershipRow.startDate,
      endDate: membershipRow.endDate,
      status,
      daysRemaining,
      frozenAt: membershipRow.frozenAt,
      freezeEndsAt: membershipRow.freezeEndsAt,
      totalFrozenDays: membershipRow.totalFrozenDays,
    };
  }

  // Phase 1 — availability for today's classes
  const classIds = todaysClasses.map((c) => c.id);
  const todayBookedCounts =
    classIds.length > 0
      ? await prisma.classBooking.groupBy({
          by: ["classScheduleId"],
          where: {
            classScheduleId: { in: classIds },
            classDate: { gte: startOfToday, lt: startOfTomorrow },
            status: "CONFIRMED",
          },
          _count: { _all: true },
        })
      : [];
  const bookedId = new Set(todaysClassBookings.map((b) => b.classScheduleId));

  const todaysClassesWithAvailability = todaysClasses.map((cls) => {
    const counted = todayBookedCounts.find((g) => g.classScheduleId === cls.id);
    const booked = counted?._count._all ?? 0;
    return {
      ...cls,
      booked,
      spotsLeft: Math.max(0, cls.maxCapacity - booked),
      full: booked >= cls.maxCapacity,
      isBooked: bookedId.has(cls.id),
    };
  });

  // Phase 1 — last-7-days attendance rollup: array of { date('YYYY-MM-DD'), visits }
  const weekKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const weekCounts = new Map<string, number>();
  for (const a of weekAttendance) {
    const k = weekKey(a.checkIn);
    weekCounts.set(k, (weekCounts.get(k) ?? 0) + 1);
  }
  const weekVisits: { date: string; visits: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    weekVisits.push({ date: weekKey(d), visits: weekCounts.get(weekKey(d)) ?? 0 });
  }

  return {
    user: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      memberCode: user?.memberCode,
      profileImageUrl: user?.profileImageUrl,
    },
    profile,
    // Derived from whether Aadhaar + address + a contact are on file. Tells the
    // member dashboard to show the "visit the front desk to verify" banner.
    verificationNeeded: !isMemberVerified(profile),
    membership,
    attendance: {
      total: attendanceCount,
      todayCheckIn: todayCheckIn ?? null,
      recent: recentAttendance,
      monthVisits,
      weekVisits,
    },
    workoutPlan: latestPlan,
    joinedCompetitions,
    dietPlan,
    measurements,
    todaysClasses: todaysClassesWithAvailability,
    announcements,
  };
}