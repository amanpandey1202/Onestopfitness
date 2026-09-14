import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { nextClassDates, localDateKey } from "@/lib/classes";

/**
 * GET /api/public/classes
 * Returns active classes with per-date availability for the next 3 weeks.
 * Public — no auth required.
 */
export async function GET() {
  try {
    const now = new Date();
    const classes = await prisma.classSchedule.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: { _count: { select: { bookings: true } } },
    });

    // For each class, fetch confirmed bookings for the next 3 upcoming dates
    const classesWithAvailability = await Promise.all(
      classes.map(async (cls) => {
        const upcomingDates = nextClassDates(cls.dayOfWeek, now, 3);

        const availability = await Promise.all(
          upcomingDates.map(async (date) => {
            const dateKey = localDateKey(date);
            const dateStart = new Date(dateKey + "T00:00:00");
            const dateEnd = new Date(dateKey + "T23:59:59");

            const booked = await prisma.classBooking.count({
              where: {
                classScheduleId: cls.id,
                classDate: { gte: dateStart, lte: dateEnd },
                status: "CONFIRMED",
              },
            });

            return {
              date: dateKey,
              booked,
              spotsLeft: Math.max(0, cls.maxCapacity - booked),
              full: booked >= cls.maxCapacity,
            };
          })
        );

        return {
          ...cls,
          availability,
        };
      })
    );

    return ok({ classes: classesWithAvailability });
  } catch (error) {
    return fail(error);
  }
}
