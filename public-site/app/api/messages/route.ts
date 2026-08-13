import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { fail } from "@/lib/api";

/**
 * POST /api/messages
 * Admin-only. Generates a WhatsApp message for a given member + type.
 * Returns the message text + WhatsApp deep-link URL (wa.me).
 * Actual delivery happens when the admin clicks that link — no third-party
 * API key needed, works with any WhatsApp number.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { type, memberId, customMessage } = await req.json();

    if (!type || !memberId) {
      return NextResponse.json(
        { error: "type and memberId are required" },
        { status: 400 }
      );
    }

    // Fetch member + latest attendance + latest membership in one round-trip
    const now = new Date();
    const [member, latestAttendance] = await Promise.all([
      prisma.user.findUnique({
        where: { id: memberId },
        include: {
          memberProfile: true,
          memberships: {
            include: { plan: true },
            orderBy: { endDate: "desc" },
            take: 1,
          },
        },
      }),
      prisma.attendance.findFirst({
        where: { memberId },
        orderBy: { checkIn: "desc" },
      }),
    ]);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Real days since last check-in — fixes the new Date() - new Date() = 0 bug
    const daysSinceLast = latestAttendance
      ? Math.ceil(
          (now.getTime() - new Date(latestAttendance.checkIn).getTime()) /
            86_400_000
        )
      : 999;

    const latestMembership = member.memberships[0];
    const daysUntilExpiry = latestMembership?.endDate
      ? Math.ceil(
          (new Date(latestMembership.endDate).getTime() - now.getTime()) /
            86_400_000
        )
      : 0;
    const planName = latestMembership?.plan.name ?? "your plan";
    const planPrice = latestMembership?.plan.price ?? 0;
    const name = member.name || "Friend";

    let message = "";

    switch (type) {
      case "absentee": {
        message = customMessage
          ? customMessage
          : `Hey ${name}! 💪 We've noticed you haven't visited ONE STOP FITNESS in ${daysSinceLast} days — the machines and trainers are missing you!\n\nYour fitness journey matters to us. Come back and let's get back on track together. We're here 6 days a week!\n\nSee you soon! 🔥`;
        break;
      }
      case "expiry-soon": {
        message = customMessage
          ? customMessage
          : `Hey ${name}! ⏰ A quick reminder — your *${planName}* membership (₹${planPrice.toLocaleString("en-IN")}) expires in *${Math.max(daysUntilExpiry, 0)} day${daysUntilExpiry === 1 ? "" : "s"}*.\n\nRenew now and don't break your streak. Talk to us at the front desk or reply here to continue!\n\nONE STOP FITNESS — Train Different. 💚`;
        break;
      }
      case "expiry-crossed": {
        const expiredDaysAgo = Math.abs(daysUntilExpiry);
        message = customMessage
          ? customMessage
          : `Hey ${name}! ⚠️ Your *${planName}* membership expired *${expiredDaysAgo} day${expiredDaysAgo === 1 ? "" : "s"} ago*.\n\nWe want you back! Renew at ₹${planPrice.toLocaleString("en-IN")}/month and restart your fitness journey — no gap in your progress.\n\nONE STOP FITNESS is waiting for you. 💚`;
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid message type" }, { status: 400 });
    }

    // Build WhatsApp deep-link — works on mobile (opens WA) and desktop (opens WA Web)
    const rawPhone = member.phone ?? member.memberProfile?.emergencyContact ?? "";
    const digits = rawPhone.replace(/\D/g, "");
    const waPhone = digits.length >= 10
      ? digits.startsWith("91") ? digits : "91" + digits
      : null;
    const whatsappUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
      : null;

    return NextResponse.json({
      success: true,
      memberId: member.id,
      name: member.name,
      phone: rawPhone || null,
      messageTemplate: type,
      message,
      whatsappUrl,
      daysSinceLast,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      sentAt: now.toISOString(),
    });
  } catch (error) {
    return fail(error);
  }
}
