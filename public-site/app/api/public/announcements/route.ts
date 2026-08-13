import { getPublishedAnnouncements } from "@/lib/services/public";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    return ok({ announcements: await getPublishedAnnouncements() });
  } catch (error) {
    return fail(error);
  }
}
