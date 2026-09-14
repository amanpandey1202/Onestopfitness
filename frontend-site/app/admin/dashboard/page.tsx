import { getAdminStats, getAdminEngagement, safeAdmin } from "@/lib/services/admin";
import AdminDashboardClient from "@/components/admin/dashboard/AdminDashboardClient";

export const dynamic = "force-dynamic";

/**
 * Dashboard is a server component that renders the real stats + engagement
 * data INTO the initial HTML — no client-side cold-start round trips for the
 * first paint. The client component hydrates with that data and keeps polling.
 */
export default async function AdminDashboardPage() {
  const [initialStats, initialEngagement] = await Promise.all([
    safeAdmin(() => getAdminStats(), null),
    safeAdmin(() => getAdminEngagement(), null),
  ]);

  return (
    <AdminDashboardClient initialStats={initialStats} initialEngagement={initialEngagement} />
  );
}