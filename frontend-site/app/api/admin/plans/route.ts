import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { planSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const plans = await prisma.membershipPlan.findMany({ orderBy: { price: "asc" } });
    return ok({ plans });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = planSchema.parse(body);

    const plan = await prisma.membershipPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays,
        features: JSON.stringify(data.features),
        isActive: data.isActive,
      },
    });

    await logAudit(admin.id, "CREATE_PLAN", "MembershipPlan", plan.id, { name: plan.name, price: plan.price });
    return created({ id: plan.id, name: plan.name });
  } catch (error) {
    return fail(error);
  }
}
