import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { rateLimit, reset, clientIp } from "@/lib/rate-limit";

const GENERIC_ERROR = "Invalid email or password";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    // Throttle attempts per client. 10 requests / 60s per IP.
    if (!rateLimit(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { rememberMe = true } = body as { rememberMe?: boolean };
    const data = loginSchema.parse(body);
    const email = data.email.toLowerCase();

    // Per-account throttle: 5 failed attempts / 15 min stops password guessing
    // against a specific account even if the caller spoofs their IP address.
    if (!rateLimit(`login-email:${email}`, 5, 15 * 60_000)) {
      return NextResponse.json({ error: "Too many attempts for this account. Try again later." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return the same generic message — for a missing user, a wrong
    // password, AND a suspended account — so attackers can't tell whether an
    // email exists or is blocked (prevents account enumeration).
    if (!user || !user.isActive || !(await verifyPassword(data.password, user.passwordHash))) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Successful login resets the per-account attempt counter.
    reset(`login-email:${email}`);

    await createSession(user.id, rememberMe);
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error("[api] login", error);
    // Never reveal the underlying error; return the same generic message.
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }
}
