import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { galleryCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const images = await prisma.galleryImage.findMany({ orderBy: { createdAt: "desc" } });
    return ok({ images });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = galleryCreateSchema.parse(body);

    const image = await prisma.galleryImage.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        mediaType: data.mediaType,
        storagePublicId: data.storagePublicId,
        isPublished: data.isPublished,
        createdById: admin.id,
      },
    });

    await logAudit(admin.id, "UPLOAD_GALLERY", "GalleryImage", image.id, { title: image.title });
    return created({ id: image.id, title: image.title });
  } catch (error) {
    return fail(error);
  }
}
