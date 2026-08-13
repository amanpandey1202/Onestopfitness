import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const mealSchema = z.object({
  mealName: z.string().min(1),
  timing: z.string().optional().nullable(),
  items: z.string().min(1), // JSON array of items
  calories: z.number().int().min(0).optional().nullable(),
  orderIndex: z.number().int().default(0),
});

const dietPlanSchema = z.object({
  memberId: z.string().min(1),
  trainerId: z.string().optional().nullable(),
  title: z.string().min(2).max(120),
  description: z.string().optional().nullable(),
  goal: z.string().optional().nullable(),
  calorieTarget: z.number().int().min(0).optional().nullable(),
  proteinGm: z.number().int().min(0).optional().nullable(),
  carbsGm: z.number().int().min(0).optional().nullable(),
  fatGm: z.number().int().min(0).optional().nullable(),
  meals: z.array(mealSchema).default([]),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const memberId = new URL(req.url).searchParams.get("memberId");
    const plans = await prisma.dietPlan.findMany({
      where: memberId ? { memberId } : undefined,
      include: { meals: { orderBy: { orderIndex: "asc" } }, member: { select: { name: true } } },
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
    const data = dietPlanSchema.parse(body);

    const plan = await prisma.dietPlan.create({
      data: {
        memberId: data.memberId,
        trainerId: data.trainerId ?? null,
        title: data.title,
        description: data.description ?? null,
        goal: data.goal ?? null,
        calorieTarget: data.calorieTarget ?? null,
        proteinGm: data.proteinGm ?? null,
        carbsGm: data.carbsGm ?? null,
        fatGm: data.fatGm ?? null,
        meals: {
          create: data.meals.map((m, i) => ({
            mealName: m.mealName,
            timing: m.timing ?? null,
            items: m.items,
            calories: m.calories ?? null,
            orderIndex: m.orderIndex ?? i,
          })),
        },
      },
      include: { meals: { orderBy: { orderIndex: "asc" } } },
    });

    await logAudit(admin.id, "CREATE_DIET_PLAN", "DietPlan", plan.id, { memberId: data.memberId });
    return created({ plan });
  } catch (e) {
    return fail(e);
  }
}
