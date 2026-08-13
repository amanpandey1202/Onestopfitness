import { getActiveOffers } from "@/lib/services/public";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    return ok({ offers: await getActiveOffers() });
  } catch (error) {
    return fail(error);
  }
}
