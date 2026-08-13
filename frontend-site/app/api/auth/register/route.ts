import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { registerSchema } from "@/lib/validation";
import { hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { nextMemberCode } from "@/lib/memberCode";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
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

    await createSession(user.id);
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    return fail(error);
  }
}
