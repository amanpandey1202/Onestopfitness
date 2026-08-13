import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/admin/members/[id]/qr-reset
 * Generates a new QR token for the member, invalidating the old QR code.
 * Use if a member's QR is compromised or lost.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== "MEMBER") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({ where: { id }, data: { qrToken: newToken } });
    await logAudit(admin.id, "QR_RESET", "User", id);

    return ok({ success: true, message: "QR code reset. Member needs to view their new QR." });
  } catch (error) {
    return fail(error);
  }
}
