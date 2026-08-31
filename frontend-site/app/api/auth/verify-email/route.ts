import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { setVerifyToken } from "@/lib/auth";

/**
 * Marks a user's email as verified if the token matches.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`verify:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string" || token.length < 16) {
      return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { verifyToken: token, isActive: true },
    });

    if (!user || !user.verifyTokenExpires || user.verifyTokenExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    await setVerifyToken(user.id, null);

    return ok({ message: "Email verified. Your account is now fully active." });
  } catch (error) {
    console.error("[api] verify-email", error);
    return NextResponse.json({ error: "Could not verify that email link." }, { status: 400 });
  }
}