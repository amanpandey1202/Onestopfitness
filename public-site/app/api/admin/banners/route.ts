import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { bannerSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
    return ok({ banners });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = bannerSchema.parse(body);

    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        buttonText: data.buttonText,
        buttonLink: data.buttonLink,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublished: data.isPublished,
        createdById: admin.id,
      },
    });

    await logAudit(admin.id, "CREATE_BANNER", "Banner", banner.id, { title: banner.title });
    return created({ id: banner.id, title: banner.title });
  } catch (error) {
    return fail(error);
  }
}
