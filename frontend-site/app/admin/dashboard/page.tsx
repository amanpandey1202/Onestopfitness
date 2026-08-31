"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

// ─── Types ───────────────────────────────────────────────────────────────────

type TrendPoint = { label: string; value: number };

type Stats = {
  totalMembers: number;
  activeMembers: number;
  todayCheckins: number;
  activeMemberships: number;
  monthlyRevenue: number;
  onlineRevenue?: number;
  cashRevenue?: number;
  excelRevenue?: number;
  upcomingExpiries: number;
  activeOffers: number;
  publishedCompetitions: number;
  revenueGrowth: number;
  memberGrowth: number;
  newThisMonth: number;
  absenteeMembers?: number;
  avgChurnRisk?: number;
};

// ─── HeatmapDay ───────────────────────────────────────────────────────────────

type HeatmapDay = { date: string; count: number };

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

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const target = value;
    const start = prev.current;
    prev.current = target;
    if (start === target) { setDisplay(target); return; }
    const steps = 40;
    const step = (target - start) / steps;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplay(Math.round(start + step * i));
      if (i >= steps) { clearInterval(id); setDisplay(target); }
    }, 16);
    return () => clearInterval(id);
  }, [value]);
  return <span>{prefix}{display.toLocaleString("en-IN")}{suffix}</span>;
}

// ─── Inline Bar Chart (pure CSS/SVG) ─────────────────────────────────────────

function BarChart({ data, color = "#9ad901", height = 140, label }: {
  data: TrendPoint[];
  color?: string;
  height?: number;
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className="relative w-full rounded-t-sm transition-all duration-700"
                style={{
                  height: `${Math.max(pct, 3)}%`,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                  boxShadow: `0 0 10px ${color}44`,
                }}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gym-ink px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                  {label === "revenue" ? `₹${d.value.toLocaleString("en-IN")}` : d.value}
                </div>
              </div>
              <span className="text-[9px] text-white/30">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Check-in Heatmap (GitHub-style) ─────────────────────────────────────────

function CheckinHeatmap({ data }: { data: HeatmapDay[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const weeks: HeatmapDay[][] = [];
  let week: HeatmapDay[] = [];
  data.forEach((d, i) => {
    week.push(d);
    if (week.length === 7 || i === data.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  function colorFor(count: number) {
    if (count === 0) return "rgba(255,255,255,0.05)";
    const pct = count / max;
    if (pct < 0.25) return "#9ad90144";
    if (pct < 0.5) return "#9ad90188";
    if (pct < 0.75) return "#9ad901bb";
    return "#9ad901";
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day, di) => (
            <div
              key={di}
              title={`${day.date}: ${day.count} check-in${day.count === 1 ? "" : "s"}`}
              className="h-3 w-3 rounded-[2px] cursor-default"
              style={{ background: colorFor(day.count) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  growth,
  prefix = "",
  suffix = "",
  tone = "lime",
  href,
}: {
  label: string;
  value: number;
  sub?: string;
  growth?: number;
  prefix?: string;
  suffix?: string;
  tone?: "lime" | "red" | "yellow" | "blue" | "purple";
  href?: string;
}) {
  const colors: Record<string, string> = {
    lime: "#9ad901",
    red: "#f87171",
    yellow: "#fbbf24",
    blue: "#60a5fa",
    purple: "#a78bfa",
  };
  const col = colors[tone] ?? colors.lime;

  const inner = (
    <div
      className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gym-ink p-5 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.04]"
      style={{ boxShadow: `0 0 0 0 ${col}00` }}
    >
      {/* Glow accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20" style={{ background: col, filter: "blur(28px)" }} />

      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-2 font-display text-3xl font-black" style={{ color: col }}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </p>

      <div className="mt-2 flex items-center gap-2">
        {growth !== undefined && (
          <span
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              color: growth >= 0 ? "#9ad901" : "#f87171",
              background: growth >= 0 ? "#9ad90118" : "#f8717118",
            }}
          >
            {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
          </span>
        )}
        {sub && <p className="text-[11px] text-white/35">{sub}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Action Button ────────────────────────────────────────────────────────────

function QuickAction({ href, label, icon, tone = "default" }: {
  href: string;
  label: string;
  icon: string;
  tone?: "default" | "green" | "yellow" | "red";
}) {
  const bg: Record<string, string> = {
    default: "border-white/10 text-white/70 hover:border-gym-lime/40 hover:text-gym-lime",
    green: "border-gym-lime/30 text-gym-lime hover:border-gym-lime hover:bg-gym-lime/10",
    yellow: "border-yellow-500/30 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10",
    red: "border-red-500/30 text-red-400 hover:border-red-400 hover:bg-red-400/10",
  };
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150 ${bg[tone]}`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

// ─── Alert badge label map ────────────────────────────────────────────────────

const alertLabel: Record<string, { text: string; tone: "red" | "yellow" | "green" | "neutral" }> = {
  absentee: { text: "Absent 14+ days", tone: "red" },
  "expiry-soon": { text: "Expiring soon", tone: "yellow" },
  "expiry-crossed": { text: "Expired", tone: "red" },
  "at-risk": { text: "At risk", tone: "neutral" },
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<TrendPoint[]>([]);
  const [memberTrend, setMemberTrend] = useState<TrendPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>([]);
  const [engagement, setEngagement] = useState<{
    atRisk: EngagementMember[];
    summary: { absentees: number; expirySoon: number; expiryCrossed: number; highRisk: number; totalMembers: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setStats(d.stats);
        setRevenueTrend(d.revenueTrend ?? []);
        setMemberTrend(d.memberTrend ?? []);
        setHeatmap(d.heatmap ?? []);
        setRecentAudit(d.recentAudit ?? []);
      })
      .catch(() => setError("Couldn't load dashboard data."));

    fetch("/api/admin/engagement")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setEngagement)
      .catch(() => setEngagement(null));
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Refresh while the tab is visible only. Pausing background polling saves the
    // server from running heavy aggregate queries when nobody is looking.
    let timer: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        // Skip the refresh if the document is hidden (e.g. another tab active).
        if (document.visibilityState === "visible") fetchDashboardData();
      }, 30_000);
    };
    const stopPolling = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboardData();
    };
    startPolling();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [fetchDashboardData]);

  if (error) return (
    <>
      <PageHeader title="Dashboard" />
      <p className="text-sm text-red-300">{error}</p>
    </>
  );

  if (!stats) return (
    <div className="flex justify-center py-24"><Spinner /></div>
  );

  const atRiskList = engagement?.atRisk ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Live Auto-Syncing (IST)`}
        action={
          stats.upcomingExpiries > 0 ? (
            <Badge tone="yellow">
              ⚠ {stats.upcomingExpiries} membership{stats.upcomingExpiries === 1 ? "" : "s"} expiring this week
            </Badge>
          ) : (
            <Badge tone="green">✓ All memberships healthy</Badge>
          )
        }
      />

      {/* ── KPI Grid ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KPICard
          label="Monthly Revenue"
          value={stats.monthlyRevenue}
          prefix="₹"
          growth={stats.revenueGrowth}
          sub="Razorpay + Cash + Excel"
          tone="lime"
          href="/admin/payments"
        />
        <KPICard
          label="Active Members"
          value={stats.activeMembers}
          growth={stats.memberGrowth}
          sub={`${stats.newThisMonth} joined this month`}
          tone="blue"
          href="/admin/members"
        />
        <KPICard
          label="Check-ins Today"
          value={stats.todayCheckins}
          sub="live IST count"
          tone="lime"
        />
        <KPICard
          label="Active Memberships"
          value={stats.activeMemberships}
          sub="currently valid"
          tone="purple"
          href="/admin/members"
        />
        <KPICard
          label="Expiring This Week"
          value={stats.upcomingExpiries}
          sub="need renewal push"
          tone={stats.upcomingExpiries > 0 ? "yellow" : "lime"}
          href="/admin/members"
        />
        <KPICard
          label="Absentee Members"
          value={stats.absenteeMembers ?? 0}
          sub="no check-in 14+ days"
          tone={(stats.absenteeMembers ?? 0) > 0 ? "red" : "lime"}
          href="/admin/members?status=absentee"
        />
        <KPICard
          label="Avg Churn Risk"
          value={stats.avgChurnRisk ?? 0}
          suffix="%"
          sub="absentee ratio"
          tone={(stats.avgChurnRisk ?? 0) > 20 ? "red" : "yellow"}
          href="/admin/members"
        />
        <KPICard
          label="Total Members"
          value={stats.totalMembers}
          sub="all time"
          tone="blue"
          href="/admin/members"
        />
      </div>

      {/* ── Revenue + Member Growth Charts ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">
                Revenue Trend
              </h2>
              <p className="mt-0.5 text-xs text-white/35">Last 6 months · Razorpay verified payments</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-black text-gym-lime">
                ₹{stats.monthlyRevenue.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-white/35">This month</p>
            </div>
          </div>
          {revenueTrend.length > 0 ? (
            <BarChart data={revenueTrend} label="revenue" height={120} />
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-white/30">No payment data yet — revenue will appear once members pay online.</div>
          )}
        </Card>

        {/* Member Growth */}
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">
                Member Growth
              </h2>
              <p className="mt-0.5 text-xs text-white/35">New members per month</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-black text-[#60a5fa]">
                +{stats.newThisMonth}
              </p>
              <p className="text-[10px] text-white/35">This month</p>
            </div>
          </div>
          {memberTrend.length > 0 ? (
            <BarChart data={memberTrend} color="#60a5fa" label="members" height={120} />
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-white/30">No member data in range.</div>
          )}
        </Card>
      </div>

      {/* ── Check-in Heatmap ── */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">
              Attendance Heatmap
            </h2>
            <p className="mt-0.5 text-xs text-white/35">Daily check-ins over the last 90 days (IST)</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/30">
            <span>Less</span>
            {["rgba(255,255,255,0.05)", "#9ad90144", "#9ad90188", "#9ad901bb", "#9ad901"].map((c) => (
              <span key={c} className="h-3 w-3 rounded-[2px] inline-block" style={{ background: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
        {heatmap.length > 0 ? (
          <CheckinHeatmap data={heatmap} />
        ) : (
          <EmptyState title="No check-in data yet" />
        )}
      </Card>

      {/* ── Quick Actions ── */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-white/50">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <QuickAction href="/admin/members?new=1" label="Add Member" icon="➕" tone="green" />
          <QuickAction href="/admin/broadcast" label="WhatsApp Broadcast" icon="📤" tone="green" />
          <QuickAction href="/api/admin/members/export" label="Export Members" icon="📊" />
          <QuickAction href="/admin/offers?new=1" label="New Offer" icon="🏷️" tone="yellow" />
          <QuickAction href="/admin/competitions?new=1" label="New Competition" icon="🏆" />
          <QuickAction href="/admin/gallery" label="Manage Gallery" icon="🖼️" />
          <QuickAction href="/admin/testimonials" label="Testimonials" icon="⭐" />
          <QuickAction href="/admin/announcements" label="Announcements" icon="📢" />
        </div>
      </Card>

      {/* ── Member Engagement Alerts ── */}
      <Card>
        <div className="border-b border-white/10 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">
              Member Engagement Alerts
            </h2>
            <p className="mt-0.5 text-xs text-white/40">Members who need attention right now</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="red">Absent 14+: {engagement?.summary.absentees ?? 0}</Badge>
            <Badge tone="yellow">Expiring: {engagement?.summary.expirySoon ?? 0}</Badge>
            <Badge tone="red">Expired: {engagement?.summary.expiryCrossed ?? 0}</Badge>
            <Badge tone="neutral">High Risk: {engagement?.summary.highRisk ?? 0}</Badge>
          </div>
        </div>

        {atRiskList.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No alerts right now">
              Everyone has checked in recently and memberships look healthy.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-white/30">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Last Check-in</th>
                  <th className="px-5 py-3">Alert</th>
                  <th className="px-5 py-3">Plan / Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {atRiskList.slice(0, 15).map((m) => {
                  const alert = m.alert ? alertLabel[m.alert] : null;
                  return (
                    <tr key={m.memberId} className="border-b border-white/5 hover:bg-white/[0.025] transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="text-xs text-white/35">{m.phone || "No phone"}</p>
                      </td>
                      <td className="px-5 py-3">
                        {m.lastCheckIn ? (
                          <>
                            <p className="text-white/60">{formatDate(m.lastCheckIn)}</p>
                            <p className="text-xs text-white/35">{m.daysSinceLastCheckIn} days ago</p>
                          </>
                        ) : (
                          <span className="text-xs text-white/30">Never checked in</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {alert ? (
                          <Badge tone={alert.tone}>{alert.text}</Badge>
                        ) : (
                          <Badge tone="neutral">{m.summary}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-white/70">{m.planName || "No plan"}</p>
                        {m.membershipStatus === "ACTIVE" && m.daysUntilExpiry >= 0 ? (
                          <p className="text-xs text-white/35">ends in {m.daysUntilExpiry} day{m.daysUntilExpiry === 1 ? "" : "s"}</p>
                        ) : (
                          <p className="text-xs text-red-400/70">membership expired</p>
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
                            💬 Message
                          </a>
                        ) : (
                          <span className="text-xs text-white/25">No number</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {atRiskList.length > 15 && (
              <div className="px-5 py-3 text-center">
                <Link href="/admin/members" className="text-xs text-gym-lime hover:underline">
                  View all {atRiskList.length} at-risk members →
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Recent Activity Log ── */}
      <Card>
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">Recent Activity</h2>
          <p className="mt-0.5 text-xs text-white/35">Latest admin actions across the system</p>
        </div>
        {recentAudit.length === 0 ? (
          <div className="p-5"><EmptyState title="No activity yet" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-white/30">
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Who</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.025] transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-gym-lime/90">{a.action}</span>
                  </td>
                  <td className="px-5 py-3 text-white/50 text-xs">{a.entityType}</td>
                  <td className="px-5 py-3 text-white/50 text-xs">{a.actor?.name ?? "System"}</td>
                  <td className="px-5 py-3 text-white/40 text-xs">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
