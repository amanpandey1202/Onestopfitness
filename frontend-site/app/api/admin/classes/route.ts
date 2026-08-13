import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const classSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().optional().nullable(),
  trainerId: z.string().optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMins: z.number().int().min(15).max(300).default(60),
  maxCapacity: z.number().int().min(1).max(500).default(20),
  location: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const classes = await prisma.classSchedule.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: { _count: { select: { bookings: true } } },
    });
    return ok({ classes });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const data = classSchema.parse(await req.json());
    const cls = await prisma.classSchedule.create({ data });
    await logAudit(admin.id, "CREATE_CLASS", "ClassSchedule", cls.id, { name: cls.name });
    return created({ cls });
  } catch (e) {
    return fail(e);
  }
}
