import { getAdminMembers, getAdminPlans, safeAdmin } from "@/lib/services/admin";
import MembersClient from "@/components/admin/members/MembersClient";

export const dynamic = "force-dynamic";

/**
 * Server-rendered members page — the full member list + plan picker ship in the
 * initial HTML so hover/filter/search is instant, no cold client round-trips.
 */
export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; new?: string }>;
}) {
  const sp = await searchParams;
  const [initialMembers, initialPlans] = await Promise.all([
    safeAdmin(() => getAdminMembers(), { members: [] }).then((r) => r.members),
    safeAdmin(() => getAdminPlans(), { plans: [] }).then((r) => r.plans),
  ]);

  return (
    <MembersClient
      initialMembers={initialMembers}
      initialPlans={initialPlans}
      initialStatus={sp.status}
      initialShowForm={sp.new === "1"}
    />
  );
}