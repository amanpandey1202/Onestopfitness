import { getPublishedBanners } from "@/lib/services/public";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    return ok({ banners: await getPublishedBanners() });
  } catch (error) {
    return fail(error);
  }
}
