import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { testimonialUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { deleteStoredImage } from "@/lib/storage";

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await _req.json();
    const data = testimonialUpdateSchema.parse(body);

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const updated = await prisma.testimonial.update({ where: { id }, data });

    await logAudit(admin.id, "UPDATE_TESTIMONIAL", "Testimonial", id, {
      name: updated.name,
    });
    return ok({ id: updated.id, name: updated.name });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    await prisma.testimonial.delete({ where: { id } });
    // Clean up the uploaded image so it doesn't linger on disk.
    await deleteStoredImage(existing.imageUrl);

    await logAudit(admin.id, "DELETE_TESTIMONIAL", "Testimonial", id, {
      name: existing.name,
    });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
