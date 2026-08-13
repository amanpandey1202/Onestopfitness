"use client";

import { useState } from "react";
import { Badge, Button, Card, PageHeader, Select, TextArea } from "@/components/admin/ui";

type BroadcastResult = {
  memberId: string;
  name: string;
  phone: string | null;
  whatsappUrl: string | null;
  message: string;
  daysAbsent: number | null;
  daysUntilExpiry: number | null;
  planName: string | null;
};

export default function AdminBroadcastPage() {
  const [filter, setFilter] = useState("all_active");
  const [template, setTemplate] = useState("absentee");
  const [customMsg, setCustomMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BroadcastResult[] | null>(null);

  async function generateBroadcast() {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter,
          messageTemplate: template,
          customMessage: customMsg || undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) setResults(d.results ?? []);
    } catch {
      alert("Failed to generate broadcast links");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bulk WhatsApp Outreach"
        subtitle="Filter target members, generate personalized WhatsApp messages, and reach your members with 1 click."
      />

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
              1. Select Target Group
            </label>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all_active">All Active Members</option>
              <option value="expiring_7">Expiring in Next 7 Days</option>
              <option value="expiring_14">Expiring in Next 14 Days</option>
              <option value="absentees_7">Absent 7+ Days</option>
              <option value="absentees_14">Absent 14+ Days (High Risk)</option>
              <option value="no_membership">Expired / No Active Plan</option>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
              2. Message Type / Template
            </label>
            <Select value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="absentee">Absentee Motivation (&quot;We Miss You&quot;)</option>
              <option value="expiry-soon">Expiry Reminder (&quot;Renew Now&quot;)</option>
              <option value="expiry-crossed">Expired Notice (&quot;Come Back&quot;)</option>
              <option value="custom">Custom Message (Type Below)</option>
            </Select>
          </div>
        </div>

        {template === "custom" && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Custom Message
            </label>
            <TextArea
              rows={3}
              placeholder="Hey! Gym will be closed on Sunday for festival maintenance..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button onClick={generateBroadcast} disabled={loading}>
            {loading ? "Preparing Outreach..." : "Generate WhatsApp Links"}
          </Button>
          {results && (
            <Badge tone="green">{results.length} Members Targeted</Badge>
          )}
        </div>
      </Card>

      {results && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white mb-4">
            Outreach List ({results.length})
          </h2>
          {results.length === 0 ? (
            <p className="text-sm text-white/50">No members match this filter criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Status / Plan</th>
                    <th className="px-4 py-3">Message Preview</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.memberId} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{r.name}</p>
                        <p className="text-xs text-white/40">{r.phone || "No phone"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/60">
                        {r.planName ? <p className="font-medium text-white">{r.planName}</p> : <p className="text-red-300">No active plan</p>}
                        {r.daysAbsent != null && <p>Absent {r.daysAbsent} days</p>}
                        {r.daysUntilExpiry != null && <p>Ends in {r.daysUntilExpiry} days</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/70 max-w-sm truncate">
                        {r.message}
                      </td>
                      <td className="px-4 py-3">
                        {r.whatsappUrl ? (
                          <a
                            href={r.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded bg-[#25d366] px-3 py-1.5 text-xs font-bold text-[#062b12] hover:bg-[#34df73] transition"
                          >
                            Send WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-white/30">No Phone</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
