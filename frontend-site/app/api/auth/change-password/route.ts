import { NextRequest, NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validation";
import { requireUser, HttpError } from "@/lib/rbac";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Member/trainer/admin self-service password change.
 * Requires the current password, applies the password policy, then updates.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const ip = clientIp(req);
    if (!rateLimit(`change-pass:${user.id}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const data = changePasswordSchema.parse(body);

    const okCurrent = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!okCurrent) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(data.newPassword) },
    });

    // Invalidate all other sessions so a leaked session can't survive the change.
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const currentToken = store.get("osf_session")?.value;
    await prisma.session.deleteMany({
      where: { userId: user.id, ...(currentToken ? { NOT: { token: currentToken } } : {}) },
    });

    return ok({ message: "Password updated." });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api] change-password", error);
    return NextResponse.json({ error: "Could not change your password." }, { status: 400 });
  }
}