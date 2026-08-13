import { NextRequest } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/rbac";
import { getMemberDashboard } from "@/lib/services/member";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireMember();
    const data = await getMemberDashboard(user.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

const profileUpdateSchema = z.object({
  phone: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  fitnessGoal: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : v)),
});

/** Members update their own contact details + fitness goal. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireMember();
    const body = await req.json();
    const data = profileUpdateSchema.parse(body);

    if (data.phone !== undefined) {
      await prisma.user.update({ where: { id: user.id }, data: { phone: data.phone } });
    }
    if (data.fitnessGoal !== undefined) {
      await prisma.memberProfile.update({
        where: { userId: user.id },
        data: { fitnessGoal: data.fitnessGoal },
      });
    }
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
