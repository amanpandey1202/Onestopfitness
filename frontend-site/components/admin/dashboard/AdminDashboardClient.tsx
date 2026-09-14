"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { Badge, Card, EmptyState, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { KPICard } from "@/components/admin/dashboard/KPICard";
import { LineChart, type TrendPoint } from "@/components/admin/dashboard/LineChart";
import { Heatmap, type HeatmapDay } from "@/components/admin/dashboard/Heatmap";
import { RevenueSplit } from "@/components/admin/dashboard/RevenueSplit";
import { OffersStrip } from "@/components/admin/dashboard/OffersStrip";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  activeOffers?: number;
  publishedCompetitions?: number;
  revenueGrowth: number;
  memberGrowth: number;
  newThisMonth: number;
  absenteeMembers?: number;
  avgChurnRisk?: number;
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

type EngagementData = {
  atRisk: EngagementMember[];
  summary: { absentees: number; expirySoon: number; expiryCrossed: number; highRisk: number; totalMembers: number };
};

type InitialStats = {
  stats: Stats;
  revenueTrend: TrendPoint[];
  memberTrend: TrendPoint[];
  heatmap: HeatmapDay[];
  recentAudit: AuditEntry[];
};

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({
  children,
  sub,
  action,
}: {
  children: React.ReactNode;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-full bg-gym-lime shadow-glow-sm" />
          <h2 className="heading-condensed text-xl text-white">{children}</h2>
        </div>
        {sub && <p className="mt-1 text-xs text-white/35">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Quick action button ─────────────────────────────────────────────────────

function QuickAction({
  href,
  label,
  icon,
  tone = "default",
}: {
  href: string;
  label: string;
  icon: IconName;
  tone?: "default" | "green" | "yellow" | "red";
}) {
  const tones: Record<string, string> = {
    default: "border-white/10 text-white/70 hover:border-gym-lime/40 hover:text-gym-lime",
    green: "border-gym-lime/30 text-gym-lime hover:border-gym-lime hover:bg-gym-lime/10",
    yellow: "border-yellow-500/30 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10",
    red: "border-red-500/30 text-red-400 hover:border-red-400 hover:bg-red-400/10",
  };
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-xl border bg-surface-2/60 px-4 py-3 text-sm font-semibold transition-all duration-150 ${tones[tone]}`}
    >
      <Icon name={icon} className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}

// ─── Alert badge label map ───────────────────────────────────────────────────

const alertLabel: Record<string, { text: string; tone: "red" | "yellow" | "green" | "neutral" }> = {
  absentee: { text: "Absent 14+ days", tone: "red" },
  "expiry-soon": { text: "Expiring soon", tone: "yellow" },
  "expiry-crossed": { text: "Expired", tone: "red" },
  "at-risk": { text: "At risk", tone: "neutral" },
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboardClient({
  initialStats,
  initialEngagement,
}: {
  initialStats: InitialStats | null;
  initialEngagement: EngagementData | null;
}) {
  // Seed straight from the server-rendered HTML when available, so the page
  // renders instantly instead of waiting on client-side cold fetches.
  const [stats, setStats] = useState<Stats | null>(initialStats?.stats ?? null);
  const [revenueTrend, setRevenueTrend] = useState<TrendPoint[]>(initialStats?.revenueTrend ?? []);
  const [memberTrend, setMemberTrend] = useState<TrendPoint[]>(initialStats?.memberTrend ?? []);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>(initialStats?.heatmap ?? []);
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>(initialStats?.recentAudit ?? []);
  const [engagement, setEngagement] = useState<EngagementData | null>(initialEngagement);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef<AbortController | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    inflightRef.current?.abort();
    const ctrl = new AbortController();
    inflightRef.current = ctrl;
    // Never let a failed background resume blow away already-rendered data.
    try {
      const [statsRes, engRes] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store", signal: ctrl.signal }).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch("/api/admin/engagement", { cache: "no-store", signal: ctrl.signal }).then((r) => (r.ok ? r.json() : Promise.reject())),
      ]);
      if (ctrl.signal.aborted) return;
      setStats(statsRes.stats);
      setRevenueTrend(statsRes.revenueTrend ?? []);
      setMemberTrend(statsRes.memberTrend ?? []);
      setHeatmap(statsRes.heatmap ?? []);
      setRecentAudit(statsRes.recentAudit ?? []);
      setEngagement(engRes);
      setStale(false);
      setError(null);
    } catch {
      if (ctrl.signal.aborted) return;
      setStale(true);
      setError((prev) => (prev ? prev : "Couldn't load dashboard data. Check your connection and refresh."));
    }
  }, []);

  useEffect(() => {
    refresh();

    // Poll while visible only, but resume instantly on focus/visibility with a
    // fresh request. The interval never runs in a background tab, so a long
    // idle tab can't trigger the "couldn't load" blow-up.
    let timer: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") refresh();
      }, 30_000);
    };
    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
        focusTimerRef.current = setTimeout(refresh, 0);
        startPolling();
      } else {
        stopPolling();
      }
    };
    const onFocus = () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(refresh, 0);
    };

    startPolling();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onVisible);

    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
      inflightRef.current?.abort();
      stopPolling();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onVisible);
    };
  }, [refresh]);

  if (error && stats === null)
    return (
      <>
        <p className="label-kicker">Admin Console</p>
        <h1 className="heading-condensed mt-1 text-2xl text-white">Dashboard</h1>
        <p className="mt-3 text-sm text-red-300">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gym-lime/40 px-4 py-2 text-sm font-bold text-gym-lime hover:bg-gym-lime/10"
        >
          Retry
        </button>
      </>
    );

  if (!stats)
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );

  const atRiskList = engagement?.atRisk ?? [];
  const hasSplit = (stats.onlineRevenue ?? 0) + (stats.cashRevenue ?? 0) + (stats.excelRevenue ?? 0) > 0;
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ── Hero band ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-surface-1 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gym-lime/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-kicker">{dateLabel}</p>
            <h1 className="mt-2 font-anton text-4xl uppercase leading-none tracking-wide text-white sm:text-5xl">
              Gym <span className="glow-lime">Command Center</span>
            </h1>
            <p className="mt-3 flex items-center gap-2.5 text-sm text-white/55">
              <span className="relative flex h-2 w-2">
                <span className={stale ? "absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" : "absolute inline-flex h-full w-full animate-ping rounded-full bg-gym-lime opacity-75"} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${stale ? "bg-yellow-400" : "bg-gym-lime"}`} />
              </span>
              {stale
                ? "Showing last snapshot — couldn't refresh, retrying…"
                : "Live Auto-Syncing (IST) · auto-refreshes every 30s"}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {stats.upcomingExpiries > 0 ? (
              <>
                <Badge tone="yellow">
                  ⚠ {stats.upcomingExpiries} membership{stats.upcomingExpiries === 1 ? "" : "s"} expiring this week
                </Badge>
                <Link
                  href="/admin/broadcast"
                  className="text-xs font-bold text-gym-lime transition hover:underline"
                >
                  Launch renewal push →
                </Link>
              </>
            ) : (
              <Badge tone="green">✓ All memberships healthy</Badge>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero KPI row ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KPICard
          label="Monthly Revenue"
          value={stats.monthlyRevenue}
          prefix="₹"
          growth={stats.revenueGrowth}
          sub="Razorpay + Cash + Excel"
          tone="lime"
          href="/admin/payments"
          spark={revenueTrend.map((t) => t.value)}
        />
        <KPICard
          label="Active Members"
          value={stats.activeMembers}
          growth={stats.memberGrowth}
          sub={`${stats.newThisMonth} joined this month`}
          tone="blue"
          href="/admin/members"
          spark={memberTrend.map((t) => t.value)}
        />
        <KPICard
          label="Check-ins Today"
          value={stats.todayCheckins}
          sub="live IST count"
          tone="lime"
          spark={heatmap.slice(-14).map((d) => d.count)}
        />
        <KPICard
          label="Total Members"
          value={stats.totalMembers}
          sub="all time"
          tone="purple"
          href="/admin/members"
          spark={memberTrend.map((t) => t.value)}
        />
        <KPICard
          label="Avg Churn Risk"
          value={stats.avgChurnRisk ?? 0}
          suffix="%"
          sub="absentee ratio"
          tone={(stats.avgChurnRisk ?? 0) > 20 ? "red" : "yellow"}
          href="/admin/members"
        />
      </div>

      {/* ── Secondary KPI row ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KPICard
          compact
          label="Active Memberships"
          value={stats.activeMemberships}
          sub="currently valid"
          tone="blue"
          href="/admin/members"
        />
        <KPICard
          compact
          label="Expiring This Week"
          value={stats.upcomingExpiries}
          sub="need renewal push"
          tone={stats.upcomingExpiries > 0 ? "yellow" : "lime"}
          href="/admin/members"
        />
        <KPICard
          compact
          label="Absentee Members"
          value={stats.absenteeMembers ?? 0}
          sub="no check-in 14+ days"
          tone={(stats.absenteeMembers ?? 0) > 0 ? "red" : "lime"}
          href="/admin/members?status=absentee"
        />
      </div>

      {/* ── Revenue + Member Growth charts ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle
            sub="Last 6 months · Razorpay verified payments"
            action={
              <div className="text-right">
                <p className="font-display text-3xl leading-none text-gym-lime">
                  ₹{stats.monthlyRevenue.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-[10px] text-white/35">This month</p>
              </div>
            }
          >
            Revenue Trend
          </SectionTitle>
          {revenueTrend.length > 0 ? (
            <LineChart data={revenueTrend} color="#9ad901" unit="revenue" />
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-white/30">
              No payment data yet — revenue will appear once members pay online.
            </div>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle
            sub="New members per month"
            action={
              <div className="text-right">
                <p className="font-display text-3xl leading-none text-[#60a5fa]">
                  +{stats.newThisMonth}
                </p>
                <p className="mt-1 text-[10px] text-white/35">This month</p>
              </div>
            }
          >
            Member Growth
          </SectionTitle>
          {memberTrend.length > 0 ? (
            <LineChart data={memberTrend} color="#60a5fa" unit="count" />
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-white/30">
              No member data in range.
            </div>
          )}
        </Card>
      </div>

      {/* ── Revenue split + Attendance heatmap ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2">
          <SectionTitle sub="This month · broken down by payment source">Revenue Split</SectionTitle>
          {hasSplit ? (
            <RevenueSplit
              online={stats.onlineRevenue}
              cash={stats.cashRevenue}
              excel={stats.excelRevenue}
            />
          ) : (
            <div className="flex h-40 items-center justify-center">
              <EmptyState title="No payment data yet" />
            </div>
          )}
        </Card>

        <Card className="p-6 lg:col-span-3">
          <SectionTitle
            sub="Daily check-ins over the last 90 days (IST)"
            action={
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                <span>Less</span>
                {["rgba(255,255,255,0.06)", "#9ad90144", "#9ad90188", "#9ad901bb", "#9ad901"].map((c) => (
                  <span key={c} className="inline-block h-3 w-3 rounded-[2px]" style={{ background: c }} />
                ))}
                <span>More</span>
              </div>
            }
          >
            Attendance Heatmap
          </SectionTitle>
          {heatmap.length > 0 ? <Heatmap data={heatmap} /> : <EmptyState title="No check-in data yet" />}
        </Card>
      </div>

      {/* ── Quick actions + offers ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <SectionTitle sub="Shortcuts to the tools you use most">Quick Actions</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <QuickAction href="/admin/members?new=1" label="Add Member" icon="user" tone="green" />
            <QuickAction href="/admin/broadcast" label="Broadcast" icon="send" tone="green" />
            <QuickAction href="/api/admin/members/export?confirm=1" label="Export" icon="file" />
            <QuickAction href="/admin/offers?new=1" label="New Offer" icon="tag" tone="yellow" />
            <QuickAction href="/admin/competitions?new=1" label="Competition" icon="trophy" />
            <QuickAction href="/admin/gallery" label="Gallery" icon="image" />
            <QuickAction href="/admin/testimonials" label="Reviews" icon="star" />
            <QuickAction href="/admin/announcements" label="Announce" icon="megaphone" />
          </div>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-5">
            <SectionTitle sub="What's live on the public site now">Promotions</SectionTitle>
            <OffersStrip
              offers={stats.activeOffers ?? 0}
              competitions={stats.publishedCompetitions ?? 0}
            />
          </Card>
        </div>
      </div>

      {/* ── Member engagement alerts ── */}
      <Card>
        <div className="border-b border-white/10 px-5 py-4">
          <SectionTitle sub="Members who need attention right now">
            Member Engagement Alerts
          </SectionTitle>
          <div className="mb-2 flex flex-wrap gap-2">
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
                    <tr key={m.memberId} className="border-b border-white/5 transition-colors hover:bg-white/[0.025]">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="font-mono text-xs text-white/35">{m.phone || "No phone"}</p>
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
                          <p className="text-xs text-white/35">
                            ends in {m.daysUntilExpiry} day{m.daysUntilExpiry === 1 ? "" : "s"}
                          </p>
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
                            Message
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

      {/* ── Recent activity ── */}
      <Card>
        <div className="border-b border-white/10 px-5 py-4">
          <SectionTitle sub="Latest admin actions across the system">Recent Activity</SectionTitle>
        </div>
        {recentAudit.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No activity yet" />
          </div>
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
                <tr key={a.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.025]">
                  <td className="px-5 py-3 font-mono text-xs text-gym-lime/90">{a.action}</td>
                  <td className="px-5 py-3 text-xs text-white/50">{a.entityType}</td>
                  <td className="px-5 py-3 text-xs text-white/50">{a.actor?.name ?? "System"}</td>
                  <td className="px-5 py-3 text-xs text-white/40">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}