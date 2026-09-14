import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

/**
 * DELETE /api/me/classes/[id]
 * Cancels a booking (sets status: "CANCELLED"), freeing the spot.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMember();
    const { id } = await ctx.params;

    const booking = await prisma.classBooking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.memberId !== user.id) return NextResponse.json({ error: "Not your booking." }, { status: 403 });
    if (booking.status === "CANCELLED") return ok({ success: true }); // idempotent

    await prisma.classBooking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
