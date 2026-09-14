import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const userCount = await prisma.user.count();
    const planCount = await prisma.membershipPlan.count();

    return NextResponse.json({
      status: "SUCCESS",
      message: "Database connected successfully!",
      usersInDb: userCount,
      plansInDb: planCount,
    });
  } catch (err) {
    const error = err as { message?: string; name?: string; code?: string };
    return NextResponse.json({
      status: "FAILED",
      errorMessage: error.message || "Unknown error",
      errorName: error.name,
      errorCode: error.code,
    }, { status: 500 });
  }
}
