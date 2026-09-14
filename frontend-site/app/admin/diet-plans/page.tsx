import { getAdminDietPlans, getAdminMembers, getAdminTrainers, safeAdmin } from "@/lib/services/admin";
import DietPlansClient from "@/components/admin/dietPlans/DietPlansClient";

export const dynamic = "force-dynamic";

export default async function AdminDietPlansPage() {
  const [plansData, membersData, trainersData] = await Promise.all([
    safeAdmin(() => getAdminDietPlans(), null),
    safeAdmin(() => getAdminMembers(), null),
    safeAdmin(() => getAdminTrainers(), null),
  ]);

  return (
    <DietPlansClient
      initialPlans={plansData?.plans ?? null}
      initialMembers={membersData?.members ?? null}
      initialTrainers={trainersData?.trainers ?? null}
    />
  );
}