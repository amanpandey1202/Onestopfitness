import { getActivePlans } from "@/lib/services/public";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    return ok({ plans: await getActivePlans() });
  } catch (error) {
    return fail(error);
  }
}
