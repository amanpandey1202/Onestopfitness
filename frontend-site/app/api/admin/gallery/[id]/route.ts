import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { galleryUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { deleteStoredImage } from "@/lib/storage";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = galleryUpdateSchema.parse(body);

    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    const newUrl = typeof data.imageUrl === "string" ? data.imageUrl : undefined;
    const updated = await prisma.galleryImage.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        mediaType: data.mediaType,
        imageUrl: newUrl,
        isPublished: data.isPublished,
      },
    });

    // If the image was replaced, remove the old uploaded file.
    if (newUrl && newUrl !== image.imageUrl) {
      await deleteStoredImage(image.imageUrl).catch(() => {});
    }

    await logAudit(admin.id, "UPDATE_GALLERY", "GalleryImage", id, { title: updated.title });
    return ok({ id: updated.id, title: updated.title });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    await prisma.galleryImage.delete({ where: { id } });
    await deleteStoredImage(image.imageUrl);
    await logAudit(admin.id, "DELETE_GALLERY", "GalleryImage", id, { title: image.title });

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
