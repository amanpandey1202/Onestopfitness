import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { dietPlanSchema } from "@/lib/dietSchemas";
import { requireActiveTrainerId, requireValidMemberId } from "@/lib/dietPatch";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const memberId = new URL(req.url).searchParams.get("memberId");
    const plans = await prisma.dietPlan.findMany({
      where: memberId ? { memberId } : undefined,
      include: {
        meals: { orderBy: { orderIndex: "asc" } },
        member: { select: { id: true, name: true, memberCode: true } },
        trainer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok({ plans });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = dietPlanSchema
      .extend({
        memberId: z.string().min(1).optional(),
        memberIds: z.array(z.string().min(1)).optional(),
      })
      .superRefine((v, ctx) => {
        const ids = v.memberIds ?? (v.memberId ? [v.memberId] : []);
        if (ids.length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one member." });
        }
      })
      .parse(body);

    const memberIds = data.memberIds ?? (data.memberId ? [data.memberId] : []);
    const uniqueIds = [...new Set(memberIds)];

    // Every id must point at a real MEMBER account.
    for (const id of uniqueIds) {
      await requireValidMemberId(id);
    }

    // Only allow assignment when a real, active trainer id is supplied.
    const trainerId = await requireActiveTrainerId(data.trainerId);

    const meals = data.meals.map((m, i) => ({
      mealName: m.mealName,
      timing: m.timing ?? null,
      items: m.items,
      calories: m.calories ?? null,
      dayOfWeek: m.dayOfWeek ?? null,
      orderIndex: m.orderIndex ?? i,
    }));

    const plans = await prisma.$transaction(
      uniqueIds.map((memberId) =>
        prisma.dietPlan.create({
          data: {
            memberId,
            trainerId,
            title: data.title,
            description: data.description ?? null,
            goal: data.goal ?? null,
            calorieTarget: data.calorieTarget ?? null,
            proteinGm: data.proteinGm ?? null,
            carbsGm: data.carbsGm ?? null,
            fatGm: data.fatGm ?? null,
            meals: { create: meals },
          },
          include: { meals: { orderBy: { orderIndex: "asc" } } },
        })
      )
    );

    await Promise.all(
      plans.map((plan) =>
        logAudit(admin.id, "CREATE_DIET_PLAN", "DietPlan", plan.id, {
          memberId: plan.memberId,
          bulk: uniqueIds.length,
        })
      )
    );
    return created({ plan: plans.map((p) => p) });
  } catch (e) {
    return fail(e);
  }
}