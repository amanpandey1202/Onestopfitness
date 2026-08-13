import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";

const bookSchema = z.object({
  classScheduleId: z.string().min(1),
  classDate: z.string().min(1), // ISO date string yyyy-mm-dd
});

/** GET — member's upcoming bookings */
export async function GET() {
  try {
    const user = await requireMember();
    const now = new Date();
    const bookings = await prisma.classBooking.findMany({
      where: { memberId: user.id, classDate: { gte: now }, status: "CONFIRMED" },
      include: { class: true },
      orderBy: { classDate: "asc" },
      take: 10,
    });
    return ok({ bookings });
  } catch (e) {
    return fail(e);
  }
}

/** POST — book a class */
export async function POST(req: NextRequest) {
  try {
    const user = await requireMember();
    const body = await req.json();
    const data = bookSchema.parse(body);

    const now = new Date();

    // Check membership is active
    const membership = await prisma.membership.findFirst({
      where: { memberId: user.id, status: "ACTIVE", endDate: { gte: now } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Active membership required to book classes." }, { status: 403 });
    }

    const cls = await prisma.classSchedule.findUnique({ where: { id: data.classScheduleId } });
    if (!cls || !cls.isActive) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const classDate = new Date(data.classDate);

    // Check capacity
    const bookingCount = await prisma.classBooking.count({
      where: { classScheduleId: data.classScheduleId, classDate, status: "CONFIRMED" },
    });
    if (bookingCount >= cls.maxCapacity) {
      return NextResponse.json({ error: "Class is full." }, { status: 409 });
    }

    // No duplicate booking
    const existing = await prisma.classBooking.findUnique({
      where: { classScheduleId_memberId_classDate: { classScheduleId: data.classScheduleId, memberId: user.id, classDate } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already booked for this class." }, { status: 409 });
    }

    const booking = await prisma.classBooking.create({
      data: { classScheduleId: data.classScheduleId, memberId: user.id, classDate, status: "CONFIRMED" },
    });

    return created({ booking });
  } catch (e) {
    return fail(e);
  }
}
