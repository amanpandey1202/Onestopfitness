"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, PageHeader, Select, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

export type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: string;
  actor: { name: string; email: string; role: string } | null;
};

export default function AuditClient({
  initialLogs,
  initialLimit,
}: {
  initialLogs: Log[] | null;
  initialLimit?: string;
}) {
  const [logs, setLogs] = useState<Log[] | null>(initialLogs);
  const [limit, setLimit] = useState(initialLimit ?? "50");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/audit-logs?limit=${limit}`);
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setLogs(data.logs);
    } catch {
      setError("Couldn't load audit logs.");
    }
  }, [limit]);

  useEffect(() => {
    if (logs === null) reload();
  }, [logs, reload]);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="Every admin action is recorded here for accountability."
        action={
          <Select value={limit} onChange={(e) => setLimit(e.target.value)} className="w-32">
            <option value="20">Last 20</option>
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
            <option value="200">Last 200</option>
          </Select>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {logs === null ? (
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState title="No logs yet" />
      ) : (
        <div className="tw">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>By</th>
                <th>Email</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="fw5 tmo" style={{ fontSize: 11.5 }}>{log.action}</td>
                  <td className="mu">
                    {log.entityType}
                    {log.entityId && (
                      <span className="tft tmo" style={{ display: "block", fontSize: 10.5 }}>{log.entityId}</span>
                    )}
                  </td>
                  <td>{log.actor ? log.actor.name : "System"}</td>
                  <td className="mo">{log.actor ? log.actor.email : "system"}</td>
                  <td className="mo">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
