import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const raw = Number(url.searchParams.get("limit"));
    const take = Number.isFinite(raw) ? Math.min(Math.max(Math.floor(raw), 1), 200) : 50;
    const logs = await prisma.auditLog.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { name: true, email: true, role: true } },
      },
    });
    return ok({ logs });
  } catch (error) {
    return fail(error);
  }
}
