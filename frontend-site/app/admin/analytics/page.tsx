import { getAdminAnalytics, safeAdmin, type AdminAnalyticsPayload } from "@/lib/services/admin";
import AnalyticsClient from "@/components/admin/analytics/AnalyticsClient";

export const dynamic = "force-dynamic";

const fallback: AdminAnalyticsPayload = {
  monthlyRevenue: [],
  revenueByPlan: [],
  peakHours: [],
  memberGrowth: [],
  totalRevenue: 0,
  totalPayments: 0,
};

/** Server-rendered analytics — 12-month data ships in the initial HTML. */
export default async function AdminAnalyticsPage() {
  const data = await safeAdmin(() => getAdminAnalytics(), null);

  return <AnalyticsClient data={data ?? fallback} />;
}