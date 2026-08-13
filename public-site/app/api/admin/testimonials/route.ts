import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { testimonialSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok({ testimonials });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = testimonialSchema.parse(body);

    const testimonial = await prisma.testimonial.create({ data });

    await logAudit(admin.id, "CREATE_TESTIMONIAL", "Testimonial", testimonial.id, {
      name: testimonial.name,
    });
    return created({ id: testimonial.id, name: testimonial.name });
  } catch (error) {
    return fail(error);
  }
}
