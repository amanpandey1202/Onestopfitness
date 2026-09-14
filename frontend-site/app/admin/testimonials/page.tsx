import { getAdminTestimonials, safeAdmin } from "@/lib/services/admin";
import TestimonialsClient from "@/components/admin/testimonials/TestimonialsClient";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const data = await safeAdmin(() => getAdminTestimonials(), null);
  return <TestimonialsClient initial={data?.testimonials ?? null} />;
}