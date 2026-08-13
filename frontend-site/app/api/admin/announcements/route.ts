import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { announcementSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const announcements = await prisma.announcement.findMany({ orderBy: { publishAt: "desc" } });
    return ok({ announcements });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = announcementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        expiresAt: data.expiresAt,
        isPublished: data.isPublished,
        createdById: admin.id,
      },
    });

    await logAudit(admin.id, "CREATE_ANNOUNCEMENT", "Announcement", announcement.id, {
      title: announcement.title,
    });
    return created({ id: announcement.id, title: announcement.title });
  } catch (error) {
    return fail(error);
  }
}
