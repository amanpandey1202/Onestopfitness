import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { competitionSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const competitions = await prisma.competition.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { participants: true } } },
    });
    return ok({ competitions });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = competitionSchema.parse(body);

    const competition = await prisma.competition.create({
      data: {
        title: data.title,
        description: data.description,
        bannerUrl: data.bannerUrl,
        linkUrl: data.linkUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        maxParticipants: data.maxParticipants,
        status: data.status,
        createdById: admin.id,
      },
    });

    await logAudit(admin.id, "CREATE_COMPETITION", "Competition", competition.id, {
      title: competition.title,
      status: competition.status,
    });
    return created({ id: competition.id, title: competition.title });
  } catch (error) {
    return fail(error);
  }
}
