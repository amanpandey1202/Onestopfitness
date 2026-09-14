import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { offerUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { deleteStoredImage } from "@/lib/storage";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = offerUpdateSchema.parse(body);

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        discountValue: data.discountValue,
        discountType: data.discountType,
        imageUrl: data.imageUrl,
        planId: data.planId,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
      },
    });

    // If the image was replaced, remove the old uploaded file.
    if (data.imageUrl && data.imageUrl !== offer.imageUrl) {
      await deleteStoredImage(offer.imageUrl).catch(() => {});
    }

    await logAudit(admin.id, "UPDATE_OFFER", "Offer", id, { title: updated.title });
    return ok({ id: updated.id, title: updated.title });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    await prisma.offer.delete({ where: { id } });
    await deleteStoredImage(offer.imageUrl).catch(() => {});
    await logAudit(admin.id, "DELETE_OFFER", "Offer", id, { title: offer.title });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
