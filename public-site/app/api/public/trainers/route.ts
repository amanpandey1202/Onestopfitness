import { getPublishedTrainers } from "@/lib/services/public";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    return ok({ trainers: await getPublishedTrainers() });
  } catch (error) {
    return fail(error);
  }
}
