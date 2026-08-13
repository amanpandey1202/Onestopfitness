import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const take = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { actor: { select: { name: true, email: true, role: true } } },
    });
    return ok({ logs });
  } catch (error) {
    return fail(error);
  }
}
