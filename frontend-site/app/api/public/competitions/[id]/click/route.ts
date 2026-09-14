import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // Public vanity counter — throttle per IP so one client can't inflate it.
    if (!rateLimit(`click:${id}:${clientIp(req)}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const competition = await prisma.competition.findUnique({ where: { id }, select: { id: true } });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const updated = await prisma.competition.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
      select: { id: true, clickCount: true },
    });

    return ok({ id: updated.id, clickCount: updated.clickCount });
  } catch (error) {
    return fail(error);
  }
}