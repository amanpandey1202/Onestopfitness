import { getAdminClasses, getAdminTrainers, safeAdmin } from "@/lib/services/admin";
import ClassesClient, { type Trainer as ClassesTrainer } from "@/components/admin/classes/ClassesClient";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  const [classesData, trainersData] = await Promise.all([
    safeAdmin(() => getAdminClasses(), null),
    safeAdmin(() => getAdminTrainers(), null),
  ]);

  return (
    <ClassesClient
      initialClasses={classesData?.classes ?? null}
      initialTrainers={(trainersData?.trainers ?? null) as ClassesTrainer[] | null}
    />
  );
}