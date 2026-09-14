import { getAdminTrainers, safeAdmin } from "@/lib/services/admin";
import TrainersClient from "@/components/admin/trainers/TrainersClient";

export const dynamic = "force-dynamic";

export default async function AdminTrainersPage() {
  const data = await safeAdmin(() => getAdminTrainers(), null);
  return <TrainersClient initial={data?.trainers ?? null} />;
}