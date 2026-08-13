import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "This account has been suspended. Contact the gym." }, { status: 403 });
    }

    await createSession(user.id);
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    return fail(error);
  }
}
