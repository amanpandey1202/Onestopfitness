import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const measurementSchema = z.object({
  memberId: z.string().min(1),
  recordedAt: z.string().optional(),
  weightKg: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  bodyFatPct: z.number().min(0).max(100).optional().nullable(),
  chestCm: z.number().positive().optional().nullable(),
  waistCm: z.number().positive().optional().nullable(),
  hipCm: z.number().positive().optional().nullable(),
  armCm: z.number().positive().optional().nullable(),
  thighCm: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const memberId = new URL(req.url).searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }
    const measurements = await prisma.bodyMeasurement.findMany({
      where: { memberId },
      orderBy: { recordedAt: "asc" },
    });
    return ok({ measurements });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = measurementSchema.parse(body);

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        memberId: data.memberId,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
        weightKg: data.weightKg ?? null,
        heightCm: data.heightCm ?? null,
        bodyFatPct: data.bodyFatPct ?? null,
        chestCm: data.chestCm ?? null,
        waistCm: data.waistCm ?? null,
        hipCm: data.hipCm ?? null,
        armCm: data.armCm ?? null,
        thighCm: data.thighCm ?? null,
        notes: data.notes ?? null,
        recordedBy: admin.id,
      },
    });

    await logAudit(admin.id, "LOG_MEASUREMENT", "BodyMeasurement", measurement.id, {
      memberId: data.memberId,
    });

    return created({ measurement });
  } catch (e) {
    return fail(e);
  }
}
