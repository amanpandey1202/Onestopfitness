import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  route: z.string().optional(), // e.g. "/member/attendance"
  memberIds: z.array(z.string()).optional(), // if empty = broadcast to all
});

/**
 * POST /api/admin/push
 * Sends a push notification to members via FCM.
 * Requires: GOOGLE_FCM_SERVER_KEY env variable (set in Vercel dashboard, never in APK).
 *
 * If memberIds is provided, sends only to those members.
 * If memberIds is empty, broadcasts to all members with a device token.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { title, body, route, memberIds } = schema.parse(await req.json());

    const fcmKey = process.env.GOOGLE_FCM_SERVER_KEY;
    if (!fcmKey) {
      return NextResponse.json(
        { error: "FCM not configured. Add GOOGLE_FCM_SERVER_KEY to environment variables." },
        { status: 500 }
      );
    }

    // Fetch device tokens
    const users = await prisma.user.findMany({
      where: {
        role: "MEMBER",
        isActive: true,
        deviceToken: { not: null },
        ...(memberIds && memberIds.length > 0 ? { id: { in: memberIds } } : {}),
      },
      select: { deviceToken: true },
    });

    const tokens = users.map((u) => u.deviceToken).filter(Boolean) as string[];
    if (tokens.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No registered devices found." });
    }

    // Send via FCM HTTP v1 (Legacy API for simplicity)
    const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${fcmKey}`,
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: { title, body },
        data: { route: route ?? "/" },
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channel_id: "gym_announcements",
            color: "#9AD901",
          },
        },
      }),
    });

    const fcmData = await fcmRes.json();
    return NextResponse.json({ ok: true, sent: tokens.length, fcm: fcmData });
  } catch (e) {
    return fail(e);
  }
}
