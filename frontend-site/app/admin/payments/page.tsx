import { getAdminPayments, safeAdmin, type AdminPaymentsPayload } from "@/lib/services/admin";
import PaymentsClient from "@/components/admin/payments/PaymentsClient";

export const dynamic = "force-dynamic";

const emptyFallback: AdminPaymentsPayload = {
  payments: [],
  summary: { totalRevenue: 0, onlineRevenue: 0, cashRevenue: 0, excelRevenue: 0, totalPaymentsCount: 0 },
};

/** Server-rendered payments page — the full payment list ships in the HTML. */
export default async function AdminPaymentsPage() {
  const data = await safeAdmin(() => getAdminPayments(), emptyFallback);

  return <PaymentsClient initialPayments={data.payments} />;
}