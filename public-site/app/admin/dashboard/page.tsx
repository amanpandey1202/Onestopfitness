"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type Stats = {
  totalMembers: number;
  activeMembers: number;
  todayCheckins: number;
  activeMemberships: number;
  monthlyRevenue: number;
  upcomingExpiries: number;
  activeOffers: number;
  publishedCompetitions: number;
  absenteeMembers: number;
  avgChurnRisk: number;
};

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  actor: { name: string; email: string } | null;
};

type EngagementMember = {
  memberId: string;
  name: string;
  phone: string | null;
  lastCheckIn: string | null;
  daysSinceLastCheckIn: number;
  membershipStatus: string;
  daysUntilExpiry: number;
  planName: string | null;
  churnRisk: "low" | "medium" | "high";
  alert: "absentee" | "expiry-soon" | "expiry-crossed" | "at-risk" | null;
  summary: string;
  whatsappUrl: string | null;
};

type EngagementSummary = {
  absentees: number;
  expirySoon: number;
  expiryCrossed: number;
  highRisk: number;
  totalMembers: number;
};

const alertLabel: Record<string, { text: string; tone: "red" | "yellow" | "green" | "neutral" }> = {
  absentee: { text: "Absent 14+ days", tone: "red" },
  "expiry-soon": { text: "Expiring soon", tone: "yellow" },
  "expiry-crossed": { text: "Expired", tone: "red" },
  "at-risk": { text: "At risk", tone: "neutral" },
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<{ stats: Stats; recentAudit: AuditEntry[] } | null>(null);
  const [engagement, setEngagement] = useState<{
    atRisk: EngagementMember[];
    summary: EngagementSummary;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then(setData)
      .catch(() => setError("Couldn't load dashboard data."));

    fetch("/api/admin/engagement")
      .then((r) => {
        if (!r.ok) throw new Error("engagement load failed");
        return r.json();
      })
      .then(setEngagement)
      .catch(() => setEngagement(null));
  }, []);

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <p className="text-sm text-red-300">{error}</p>
      </>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const { stats, recentAudit } = data;
  const highRisk = engagement?.summary.highRisk ?? 0;
  const expiring = engagement?.summary.expirySoon ?? 0;
  const atRiskList = engagement?.atRisk ?? [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A snapshot of your gym right now."
        action={
          <Badge tone="green">
            Expiring soon: {stats.upcomingExpiries}{" "}
            {stats.upcomingExpiries === 1 ? "membership" : "memberships"}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-white/45">Total Members</p><p className="mt-2 font-display text-3xl font-bold text-gym-lime">{stats.totalMembers}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-white/45">Active Members</p><p className="mt-2 font-display text-3xl font-bold text-gym-lime">{stats.activeMembers}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-white/45">Check-ins Today</p><p className="mt-2 font-display text-3xl font-bold text-gym-lime">{stats.todayCheckins}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-white/45">Active Memberships</p><p className="mt-2 font-display text-3xl font-bold text-gym-lime">{stats.activeMemberships}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-white/45">Monthly Revenue</p><p className="mt-2 font-display text-3xl font-bold text-gym-lime">₹{stats.monthlyRevenue.toLocaleString("en-IN")}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-white/45">Expiring Soon</p><p className="mt-2 font-display text-3xl font-bold text-gym-lime">{expiring || stats.upcomingExpiries}</p><p className="mt-1 text-xs text-white/40">Renewal push</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-white/45">Active Offers</p><p className="mt-2 font-display text-3xl font-bold text-gym-lime">{stats.activeOffers}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-white/45">High-Risk Members</p><p className="mt-2 font-display text-3xl font-bold text-gym-lime">{highRisk}</p><p className="mt-1 text-xs text-white/40">Need outreach</p></Card>
      </div>

      <Card className="mt-10">
        <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">Member Engagement Alerts</h2>
            <p className="mt-0.5 text-xs text-white/45">Computed from real attendance &amp; membership data — who needs attention right now</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="red">Absent 14+ days: {engagement?.summary.absentees ?? 0}</Badge>
            <Badge tone="yellow">Expiring soon: {engagement?.summary.expirySoon ?? 0}</Badge>
            <Badge tone="red">Expired: {engagement?.summary.expiryCrossed ?? 0}</Badge>
          </div>
        </div>

        {!engagement ? (
          <div className="p-5">
            <EmptyState title="No member alerts right now" />
          </div>
        ) : atRiskList.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No member alerts right now">Everyone has checked in recently and no memberships are expiring.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Last Check-in</th>
                  <th className="px-5 py-3">Alert</th>
                  <th className="px-5 py-3">Plan / Expiry</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {atRiskList.map((m) => {
                  const label = m.alert ? alertLabel[m.alert] : null;
                  return (
                    <tr key={m.memberId} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="text-xs text-white/40">{m.phone || "No phone on file"}</p>
                      </td>
                      <td className="px-5 py-3 text-white/60">
                        {m.lastCheckIn ? (
                          <>
                            {formatDate(m.lastCheckIn)}
                            <p className="text-xs text-white/40">{m.daysSinceLastCheckIn} days ago</p>
                          </>
                        ) : (
                          <span className="text-white/40">Never checked in</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {label ? <Badge tone={label.tone}>{label.text}</Badge> : <Badge tone="neutral">{m.summary}</Badge>}
                        <p className="mt-1 text-xs text-white/45">{m.summary}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-white/70">{m.planName || "No plan"}</p>
                        {m.membershipStatus === "ACTIVE" && m.daysUntilExpiry >= 0 ? (
                          <p className="text-xs text-white/40">ends in {m.daysUntilExpiry} day{m.daysUntilExpiry === 1 ? "" : "s"}</p>
                        ) : (
                          <p className="text-xs text-red-300/70">membership expired</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {m.whatsappUrl ? (
                          <a
                            href={m.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#25d366] px-3 py-1.5 text-xs font-bold text-[#062b12] transition hover:bg-[#34df73]"
                          >
                            Message
                          </a>
                        ) : (
                          <span className="text-xs text-white/30">No number</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-10">
        <div className="border-b border-white/10 px-5 py-4"><h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">Recent Activity</h2></div>
        {recentAudit.length === 0 && (<div className="p-5"><EmptyState title="No activity yet" /></div>)}
        {recentAudit.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40"><th className="px-5 py-3">Action</th><th className="px-5 py-3">Entity</th><th className="px-5 py-3">Who</th><th className="px-5 py-3">When</th></tr></thead>
            <tbody>
              {recentAudit.map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="px-5 py-3 text-white/80">{a.action}</td>
                  <td className="px-5 py-3 text-white/50">{a.entityType}</td>
                  <td className="px-5 py-3 text-white/50">{a.actor ? a.actor.name : "System"}</td>
                  <td className="px-5 py-3 text-white/50">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
