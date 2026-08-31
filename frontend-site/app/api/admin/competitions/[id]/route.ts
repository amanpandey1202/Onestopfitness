import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { competitionUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { deleteStoredImage } from "@/lib/storage";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        participants: { include: { member: { select: { id: true, name: true, email: true } } } },
        _count: { select: { participants: true } },
      },
    });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    return ok({ competition });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = competitionUpdateSchema.parse(body);

    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const updated = await prisma.competition.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        bannerUrl: data.bannerUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        maxParticipants: data.maxParticipants,
        status: data.status,
      },
    });

    // If the banner was replaced, remove the old uploaded file.
    if (data.bannerUrl && data.bannerUrl !== competition.bannerUrl) {
      await deleteStoredImage(competition.bannerUrl).catch(() => {});
    }

    await logAudit(admin.id, "UPDATE_COMPETITION", "Competition", id, { title: updated.title, status: updated.status });
    return ok({ id: updated.id, title: updated.title });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    await prisma.competition.delete({ where: { id } });
    await deleteStoredImage(competition.bannerUrl);
    await logAudit(admin.id, "DELETE_COMPETITION", "Competition", id, { title: competition.title });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
