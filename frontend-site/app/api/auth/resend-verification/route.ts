import { NextResponse } from "next/server";
import { getSessionUser, generateToken, setVerifyToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Resend the email-verification link for the current user.
 * Rate-limited: 3 requests per hour per user.
 */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Already verified — nothing to do.
    if (user.emailVerified) {
      return ok({ message: "Email is already verified." });
    }

    if (!rateLimit(`resend-verify:${user.id}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 },
      );
    }

    const token = generateToken();
    await setVerifyToken(user.id, token);
    await sendVerificationEmail(user.email, token);

    return ok({ message: "Verification email sent." });
  } catch (error) {
    console.error("[api] resend-verification", error);
    return NextResponse.json(
      { error: "Could not send verification email. Please try again." },
      { status: 500 },
    );
  }
}