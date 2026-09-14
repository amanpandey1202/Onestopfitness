import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { registerSchema } from "@/lib/validation";
import { hashPassword, createSession, generateToken, setVerifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { rateLimit, reset, clientIp } from "@/lib/rate-limit";
import { nextMemberCode } from "@/lib/memberCode";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    // Throttle account creation per email to stop mass fake-account signups.
    if (!rateLimit(`register-email:${email}`, 2, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      // Keep the existence signal vague to avoid easy account enumeration.
      return NextResponse.json({ error: "Unable to create account with these details." }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone,
        memberCode: await nextMemberCode(prisma),
        passwordHash: await hashPassword(data.password),
        role: Role.MEMBER,
        memberProfile: {
          create: {
            fitnessGoal: data.fitnessGoal,
          },
        },
      },
    });

    reset(`register-email:${email}`);

    // Send a verification email so members can confirm their address.
    // Soft by design: accounts remain usable, this just records verification.
    try {
      const token = generateToken();
      await setVerifyToken(user.id, token);
      await sendVerificationEmail(email, token);
      await sendWelcomeEmail(email, user.name, user.memberCode);
    } catch (e) {
      console.error("[api] register verification email", e);
    }

    await createSession(user.id);
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    // Surface validation issues as-is, but never leak internals.
    if (error && typeof error === "object" && (error as { name?: string }).name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("[api] register", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 400 });
  }
}
