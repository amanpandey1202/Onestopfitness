"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, PageHeader, Select, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: string;
  actor: { name: string; email: string; role: string } | null;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [limit, setLimit] = useState("50");
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
    reload();
  }, [reload]);

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
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="hidden px-4 py-3 lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-white/55">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    {log.actor ? (
                      <>
                        <p className="font-semibold text-white">{log.actor.name}</p>
                        <p className="text-xs text-white/45">{log.actor.role}</p>
                      </>
                    ) : (
                      <span className="text-white/40">System</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gym-lime">{log.action}</td>
                  <td className="px-4 py-3 text-white/65">
                    {log.entityType}
                    {log.entityId && <span className="block text-xs text-white/40">{log.entityId}</span>}
                  </td>
                  <td className="hidden max-w-md px-4 py-3 text-xs text-white/45 lg:table-cell">
                    {log.metadata ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
