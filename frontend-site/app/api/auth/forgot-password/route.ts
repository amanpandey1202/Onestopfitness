import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { generateToken, setResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Sends a password reset link IF the account exists.
 * Always returns the same success message to avoid email enumeration.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`forgot:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const data = forgotPasswordSchema.parse(body);
    const email = data.email.toLowerCase();

    // Throttle per-email to slow link-spam against a known address.
    if (!rateLimit(`forgot-email:${email}`, 3, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      const token = generateToken();
      await setResetToken(user.id, token);
      await sendPasswordResetEmail(user.email, user.name, token);
    }

    // Same reply whether or not the user exists.
    return ok({ message: "If that email is registered, a reset link has been sent." });
  } catch (error) {
    console.error("[api] forgot-password", error);
    return NextResponse.json({ error: "Could not process that request." }, { status: 400 });
  }
}