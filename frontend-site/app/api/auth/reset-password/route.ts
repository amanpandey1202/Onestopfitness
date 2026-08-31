import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation";
import { hashPassword, setResetToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Completes a password reset using a one-time token.
 * - Validates the token exists, belongs to an active user and isn't expired.
 * - Sets the new password, clears the token, and signs the user in.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`reset:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const data = resetPasswordSchema.parse(body);

    const user = await prisma.user.findFirst({
      where: { resetToken: data.token, isActive: true },
    });

    if (!user || !user.resetTokenExpires || user.resetTokenExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(data.password) },
    });

    // One-time token — burn it. Anyone holding a reused token gets a new link only.
    await setResetToken(user.id, null);

    // Invalidate any existing sessions so stolen tokens can't persist.
    await prisma.session.deleteMany({ where: { userId: user.id } });

    return ok({ message: "Password updated. You can now sign in with your new password." });
  } catch (error) {
    console.error("[api] reset-password", error);
    return NextResponse.json({ error: "Could not reset your password." }, { status: 400 });
  }
}