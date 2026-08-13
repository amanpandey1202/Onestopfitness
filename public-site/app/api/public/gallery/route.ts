import { getPublishedGallery } from "@/lib/services/public";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    return ok({ images: await getPublishedGallery() });
  } catch (error) {
    return fail(error);
  }
}
