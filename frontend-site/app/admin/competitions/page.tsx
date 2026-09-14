import { getAdminCompetitions, safeAdmin } from "@/lib/services/admin";
import CompetitionsClient from "@/components/admin/competitions/CompetitionsClient";

export const dynamic = "force-dynamic";

export default async function AdminCompetitionsPage() {
  const data = await safeAdmin(() => getAdminCompetitions(), null);
  return <CompetitionsClient initial={data?.competitions ?? null} />;
}