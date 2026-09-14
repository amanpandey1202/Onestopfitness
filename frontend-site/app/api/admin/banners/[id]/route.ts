import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { bannerUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { deleteStoredImage } from "@/lib/storage";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = bannerUpdateSchema.parse(body);

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });

    const updated = await prisma.banner.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        buttonText: data.buttonText,
        buttonLink: data.buttonLink,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublished: data.isPublished,
      },
    });

    // If the image was replaced, remove the old uploaded file.
    if (data.imageUrl && data.imageUrl !== banner.imageUrl) {
      await deleteStoredImage(banner.imageUrl).catch(() => {});
    }

    await logAudit(admin.id, "UPDATE_BANNER", "Banner", id, { title: updated.title });
    return ok({ id: updated.id, title: updated.title });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });

    await prisma.banner.delete({ where: { id } });
    await deleteStoredImage(banner.imageUrl).catch(() => {});
    await logAudit(admin.id, "DELETE_BANNER", "Banner", id, { title: banner.title });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
