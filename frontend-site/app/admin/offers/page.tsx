import { getAdminOffers, safeAdmin } from "@/lib/services/admin";
import OffersClient from "@/components/admin/offers/OffersClient";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const data = await safeAdmin(() => getAdminOffers(), null);

  return (
    <OffersClient
      initialOffers={data?.offers ?? null}
      initialPlans={data?.planOptions ?? []}
    />
  );
}