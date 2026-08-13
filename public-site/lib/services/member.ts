import { prisma } from "@/lib/db";
import { parseFeatures } from "@/lib/services/public";

/**
 * Assembles everything a member's dashboard needs in one query.
 * Effective membership status is computed from dates, not just the stored flag.
 */
export async function getMemberDashboard(memberId: string) {
  const now = new Date();

  const [user, profile, membershipRow, attendanceCount, todayCheckIn, latestPlan, joinedCompetitions, recentAttendance] =
    await Promise.all([
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
          checkIn: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
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
    ]);

  let membership = null;
  if (membershipRow) {
    const status =
      membershipRow.endDate.getTime() < now.getTime() ? "EXPIRED" : membershipRow.status;
    const daysRemaining = Math.max(
      0,
      Math.ceil((membershipRow.endDate.getTime() - now.getTime()) / 86_400_000)
    );
    membership = {
      id: membershipRow.id,
      plan: { ...membershipRow.plan, features: parseFeatures(membershipRow.plan.features) },
      startDate: membershipRow.startDate,
      endDate: membershipRow.endDate,
      status,
      daysRemaining,
    };
  }

  return {
    user: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      profileImageUrl: user?.profileImageUrl,
    },
    profile,
    membership,
    attendance: {
      total: attendanceCount,
      todayCheckIn: todayCheckIn ?? null,
      recent: recentAttendance,
    },
    workoutPlan: latestPlan,
    joinedCompetitions,
  };
}
