import { getPublishedTestimonials } from "@/lib/services/public";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    return ok({ testimonials: await getPublishedTestimonials() });
  } catch (error) {
    return fail(error);
  }
}
