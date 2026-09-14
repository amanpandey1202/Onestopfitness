import { getAdminPlans, safeAdmin } from "@/lib/services/admin";
import PlansClient from "@/components/admin/plans/PlansClient";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const data = await safeAdmin(() => getAdminPlans(), null);
  return <PlansClient initial={data?.plans ?? null} />;
}