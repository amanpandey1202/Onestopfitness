import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { announcementUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const data = announcementUpdateSchema.parse(body);

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        expiresAt: data.expiresAt,
        isPublished: data.isPublished,
      },
    });

    await logAudit(admin.id, "UPDATE_ANNOUNCEMENT", "Announcement", id, { title: updated.title });
    return ok({ id: updated.id, title: updated.title });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

    await prisma.announcement.delete({ where: { id } });
    await logAudit(admin.id, "DELETE_ANNOUNCEMENT", "Announcement", id, { title: announcement.title });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
