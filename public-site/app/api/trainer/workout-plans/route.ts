import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const exerciseSchema = z.object({
  exerciseName: z.string().min(1).max(120),
  sets: z.number().int().min(1).optional().nullable(),
  reps: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  restSeconds: z.number().int().min(0).optional().nullable(),
  instructions: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
});

const planSchema = z.object({
  memberId: z.string().min(1),
  title: z.string().min(2).max(120),
  description: z.string().optional().nullable(),
  goal: z.string().optional().nullable(),
  exercises: z.array(exerciseSchema).default([]),
});

/** GET — all workout plans created by this trainer */
export async function GET() {
  try {
    const trainer = await requireRole(Role.TRAINER);
    const plans = await prisma.workoutPlan.findMany({
      where: { trainerId: trainer.id },
      include: {
        member: { select: { id: true, name: true, memberCode: true } },
        exercises: { orderBy: { orderIndex: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return ok({ plans });
  } catch (e) {
    return fail(e);
  }
}

/** POST — trainer creates a new workout plan for a member */
export async function POST(req: NextRequest) {
  try {
    const trainer = await requireRole(Role.TRAINER);
    const body = await req.json();
    const data = planSchema.parse(body);

    // Verify the target is a member
    const member = await prisma.user.findUnique({ where: { id: data.memberId } });
    if (!member || member.role !== "MEMBER") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        memberId: data.memberId,
        trainerId: trainer.id,
        title: data.title,
        description: data.description ?? null,
        goal: data.goal ?? null,
        exercises: {
          create: data.exercises.map((ex, i) => ({
            exerciseName: ex.exerciseName,
            sets: ex.sets ?? null,
            reps: ex.reps ?? null,
            duration: ex.duration ?? null,
            restSeconds: ex.restSeconds ?? null,
            instructions: ex.instructions ?? null,
            orderIndex: ex.orderIndex ?? i,
          })),
        },
      },
      include: {
        member: { select: { id: true, name: true } },
        exercises: { orderBy: { orderIndex: "asc" } },
      },
    });

    await logAudit(trainer.id, "CREATE_WORKOUT_PLAN", "WorkoutPlan", plan.id, {
      memberId: data.memberId,
    });

    return created({ plan });
  } catch (e) {
    return fail(e);
  }
}
