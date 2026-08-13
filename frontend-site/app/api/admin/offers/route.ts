import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { offerSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const offers = await prisma.offer.findMany({ orderBy: { createdAt: "desc" } });
    return ok({ offers });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = offerSchema.parse(body);

    const offer = await prisma.offer.create({
      data: {
        title: data.title,
        description: data.description,
        discountValue: data.discountValue,
        discountType: data.discountType,
        imageUrl: data.imageUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        createdById: admin.id,
      },
    });

    await logAudit(admin.id, "CREATE_OFFER", "Offer", offer.id, { title: offer.title });
    return created({ id: offer.id, title: offer.title });
  } catch (error) {
    return fail(error);
  }
}
