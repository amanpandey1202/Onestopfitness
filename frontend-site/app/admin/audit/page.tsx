import { getAdminAuditLogs, safeAdmin } from "@/lib/services/admin";
import AuditClient from "@/components/admin/audit/AuditClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const data = await safeAdmin(() => getAdminAuditLogs(50), null);
  return <AuditClient initialLogs={data?.logs ?? null} initialLimit="50" />;
}