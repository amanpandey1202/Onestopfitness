import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

const DAY = 86_400_000;

type AlertKind = "absentee" | "expiry-soon" | "expiry-crossed" | "at-risk";

export type EngagementMember = {
  memberId: string;
  name: string;
  phone: string | null;
  lastCheckIn: string | null;
  daysSinceLastCheckIn: number;
  membershipStatus: string;
  daysUntilExpiry: number;
  planName: string | null;
  churnRisk: "low" | "medium" | "high";
  alert: AlertKind | null;
  summary: string;
  whatsappUrl: string | null;
};

/**
 * Real, data-driven engagement alerts. Every number comes from actual
 * attendance + membership records — no fake percentages.
 * Sorted by severity so the admin sees who needs attention first.
 */
export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const nowMs = now.getTime();

    const members = await prisma.user.findMany({
      where: { role: Role.MEMBER },
      select: {
        id: true,
        name: true,
        phone: true,
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

    const atRisk: EngagementMember[] = [];

    for (const member of members) {
      const last = member.attendance[0]?.checkIn ?? null;
      const daysSinceLastCheckIn = last
        ? Math.floor((nowMs - new Date(last).getTime()) / DAY)
        : 999;

      const membership = member.memberships[0] ?? null;
      const endMs = membership?.endDate ? new Date(membership.endDate).getTime() : null;
      const daysUntilExpiry = endMs != null ? Math.ceil((endMs - nowMs) / DAY) : 0;
      const membershipStatus =
        membership?.status === "ACTIVE"
          ? endMs != null && daysUntilExpiry < 0
            ? "EXPIRED"
            : "ACTIVE"
          : "NONE";

      // Classify real alerts
      let alert: AlertKind | null = null;
      if (membershipStatus === "ACTIVE" && daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
        alert = "expiry-soon";
      }
      if (membershipStatus === "EXPIRED") {
        alert = "expiry-crossed";
      }
      if (daysSinceLastCheckIn >= 14 && membershipStatus !== "EXPIRED") {
        alert = "absentee";
      }
      if (alert === null && daysSinceLastCheckIn >= 7) {
        alert = "at-risk";
      }

      // Only surface members who actually need attention
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
      if (membershipStatus === "EXPIRED")
        summaryParts.push("membership expired");

      const rawPhone = member.phone ?? "";
      const digits = rawPhone.replace(/\D/g, "");
      const whatsappUrl =
        digits.length >= 10
          ? `https://wa.me/${digits.startsWith("91") ? digits : "91" + digits}?text=${encodeURIComponent(
              `Hi ${member.name}, this is ONE STOP FITNESS. ${summaryParts.join(", ")}. Can we help you get back on track?`
            )}`
          : null;

      atRisk.push({
        memberId: member.id,
        name: member.name,
        phone: rawPhone,
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

    // Severity sort: high risk first, then by days absent / expiry
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

    return ok({ atRisk, summary });
  } catch (error) {
    return fail(error);
  }
}