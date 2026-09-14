import { NextRequest } from "next/server";
import { site } from "@/data/site";
import { z } from "zod";
import { Role, MembershipStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const broadcastSchema = z.object({
  filter: z.enum(["all_active", "expiring_7", "expiring_14", "absentees_7", "absentees_14", "no_membership"]),
  messageTemplate: z.enum(["absentee", "expiry-soon", "expiry-crossed", "custom"]),
  customMessage: z.string().max(1000).optional(),
});

type BroadcastMember = {
  id: string;
  name: string;
  phone: string | null;
  createdAt: Date;
  memberships: { endDate: Date; plan: { name: string; price: number } }[];
  attendance: { checkIn: Date }[];
};

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { filter, messageTemplate, customMessage } = broadcastSchema.parse(body);

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86_400_000);
    const in14Days = new Date(now.getTime() + 14 * 86_400_000);
    const ago7 = new Date(now.getTime() - 7 * 86_400_000);
    const ago14 = new Date(now.getTime() - 14 * 86_400_000);

    let members: BroadcastMember[] = [];

    const baseInclude = {
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        include: { plan: { select: { name: true, price: true } } },
        orderBy: { endDate: "desc" as const },
        take: 1,
      },
      attendance: { orderBy: { checkIn: "desc" as const }, take: 1 },
    };

    switch (filter) {
      case "all_active":
        members = await prisma.user.findMany({
          where: { role: Role.MEMBER, isActive: true, memberships: { some: { status: MembershipStatus.ACTIVE, endDate: { gte: now } } } },
          include: baseInclude,
        });
        break;

      case "expiring_7":
        members = await prisma.user.findMany({
          where: { role: Role.MEMBER, memberships: { some: { status: MembershipStatus.ACTIVE, endDate: { gte: now, lte: in7Days } } } },
          include: baseInclude,
        });
        break;

      case "expiring_14":
        members = await prisma.user.findMany({
          where: { role: Role.MEMBER, memberships: { some: { status: MembershipStatus.ACTIVE, endDate: { gte: now, lte: in14Days } } } },
          include: baseInclude,
        });
        break;

      case "absentees_7":
        members = (await prisma.user.findMany({
          where: { role: Role.MEMBER, isActive: true },
          include: baseInclude,
        })).filter((m) => {
          const last = m.attendance[0]?.checkIn ?? m.createdAt;
          return new Date(last) < ago7;
        });
        break;

      case "absentees_14":
        members = (await prisma.user.findMany({
          where: { role: Role.MEMBER, isActive: true },
          include: baseInclude,
        })).filter((m) => {
          const last = m.attendance[0]?.checkIn ?? m.createdAt;
          return new Date(last) < ago14;
        });
        break;

      case "no_membership":
        members = await prisma.user.findMany({
          where: {
            role: Role.MEMBER,
            isActive: true,
            memberships: { none: { status: MembershipStatus.ACTIVE, endDate: { gte: now } } },
          },
          include: baseInclude,
        });
        break;
    }

    const results = members.map((m) => {
      const membership = m.memberships[0];
      const lastCheckIn = m.attendance[0]?.checkIn ? new Date(m.attendance[0].checkIn) : null;
      const referenceDate = lastCheckIn ?? new Date(m.createdAt);
      const daysAbsent = Math.ceil((now.getTime() - referenceDate.getTime()) / 86_400_000);
      const daysUntilExpiry = membership?.endDate
        ? Math.ceil((new Date(membership.endDate).getTime() - now.getTime()) / 86_400_000)
        : 0;

      let message = customMessage || "";
      if (!customMessage) {
        const name = m.name;
        const planName = membership?.plan?.name ?? "your plan";
        const planPrice = membership?.plan?.price ?? 0;
        switch (messageTemplate) {
          case "absentee":
            message = site.messages.absentReminder(name, daysAbsent);
            break;
          case "expiry-soon":
            message = site.messages.expiryWarning(name, planName, planPrice, Math.max(0, daysUntilExpiry));
            break;
          case "expiry-crossed":
            message = site.messages.expiredFollowup(name, planName, planPrice, Math.max(0, daysUntilExpiry));
            break;
        }
      }

      const rawPhone = m.phone ?? "";
      const digits = rawPhone.replace(/\D/g, "");
      const waPhone = digits.length >= 10 ? (digits.startsWith("91") ? digits : "91" + digits) : null;
      const whatsappUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}` : null;

      return {
        memberId: m.id,
        name: m.name,
        phone: rawPhone || null,
        whatsappUrl,
        message,
        daysAbsent: lastCheckIn ? daysAbsent : null,
        daysUntilExpiry: membership?.endDate ? Math.max(0, daysUntilExpiry) : null,
        planName: membership?.plan?.name ?? null,
      };
    });

    await logAudit(admin.id, "BROADCAST", "Notification", undefined, {
      filter,
      messageTemplate,
      count: results.length,
    });

    return ok({ results, total: results.length, filter });
  } catch (e) {
    return fail(e);
  }
}
