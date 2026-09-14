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
    <div className="space-y-6">
      <PageHeader
        title="Bulk WhatsApp Outreach"
        subtitle="Filter target members, generate personalized WhatsApp messages, and reach your members with 1 click."
      />

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="fl">1. Select Target Group</label>
            <Select
              className="inp"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all_active">All Active Members</option>
              <option value="expiring_7">Expiring in Next 7 Days</option>
              <option value="expiring_14">Expiring in Next 14 Days</option>
              <option value="absentees_7">Absent 7+ Days</option>
              <option value="absentees_14">Absent 14+ Days (High Risk)</option>
              <option value="no_membership">Expired / No Active Plan</option>
            </Select>
          </div>

          <div>
            <label className="fl">2. Message Type / Template</label>
            <Select
              className="inp"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              <option value="absentee">Absentee Motivation (&quot;We Miss You&quot;)</option>
              <option value="expiry-soon">Expiry Reminder (&quot;Renew Now&quot;)</option>
              <option value="expiry-crossed">Expired Notice (&quot;Come Back&quot;)</option>
              <option value="custom">Custom Message (Type Below)</option>
            </Select>
          </div>
        </div>

        {template === "custom" && (
          <div className="mt-4">
            <label className="fl">Custom Message</label>
            <TextArea
              className="inp"
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
        <>
          <div className="stitle">
            <div className="stl">
              <span className="sta" />
              <h2 className="stt">Outreach List ({results.length})</h2>
            </div>
          </div>
          {results.length === 0 ? (
            <Card className="p-6">
              <p className="tsm tmu">No members match this filter criteria.</p>
            </Card>
          ) : (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Status / Plan</th>
                    <th>Message Preview</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.memberId}>
                      <td>
                        <p className="fw6">{r.name}</p>
                        <p className="tft">{r.phone || "No phone"}</p>
                      </td>
                      <td>
                        {r.planName ? (
                          <p className="fw6">{r.planName}</p>
                        ) : (
                          <p className="trd">No active plan</p>
                        )}
                        {r.daysAbsent != null && <p className="tft">Absent {r.daysAbsent} days</p>}
                        {r.daysUntilExpiry != null && <p className="tft">Ends in {r.daysUntilExpiry} days</p>}
                      </td>
                      <td>
                        <p className="tmu txs max-w-sm truncate">{r.message}</p>
                      </td>
                      <td>
                        {r.whatsappUrl ? (
                          <a
                            href={r.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wa"
                          >
                            Send WhatsApp
                          </a>
                        ) : (
                          <span className="tft txs">No Phone</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
