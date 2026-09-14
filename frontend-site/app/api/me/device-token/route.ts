import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(10),
});

/**
 * POST /api/me/device-token
 * Registers or updates the FCM push notification token for the authenticated member.
 * Called once after login from the Android app.
 * The token is stored server-side — never trusted from client without auth.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireMember();
    const body = schema.parse(await req.json());

    await prisma.user.update({
      where: { id: user.id },
      data: { deviceToken: body.token },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

/**
 * DELETE /api/me/device-token
 * Clears the FCM token on logout so notifications stop.
 */
export async function DELETE() {
  try {
    const user = await requireMember();
    await prisma.user.update({
      where: { id: user.id },
      data: { deviceToken: null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
