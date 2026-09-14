"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/components/admin/ui";
import Icon from "@/components/Icon";
import { Badge, Card, Spinner } from "@/components/admin/ui";
import { formatDate, planPeriodLabel } from "@/lib/format";
import { whatsappLink } from "@/data/site";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import MiniLineChart from "@/components/member/MiniLineChart";

type Meal = { id: string; mealName: string; timing: string | null; calories: number | null };

type DashboardData = {
  user: { id: string; name: string; email: string; phone: string | null; memberCode: string | null; profileImageUrl: string | null };
  profile: { fitnessGoal: string | null; joiningDate: string | null } | null;
  membership: {
    id: string;
    plan: { name: string; price: number; description: string | null; durationDays?: number | null; features: string[] };
    startDate: string;
    endDate: string;
    status: string;
    daysRemaining: number;
    frozenAt: string | null;
    freezeEndsAt: string | null;
  } | null;
  attendance: {
    total: number;
    todayCheckIn: { id: string; checkIn: string } | null;
    recent: { id: string; checkIn: string; method: string }[];
    monthVisits: number;
    weekVisits: { date: string; visits: number }[];
  };
  workoutPlan: {
    id: string;
    title: string;
    goal: string | null;
    description: string | null;
    trainer: { name: string } | null;
    exercises: { id: string; exerciseName: string; sets: number | null; reps: string | null; duration: string | null; restSeconds: number | null }[];
  } | null;
  joinedCompetitions: { id: string; competition: { id: string; title: string; endDate: string | null; status: string } }[];
  dietPlan: {
    id: string;
    title: string;
    goal: string | null;
    description: string | null;
    calorieTarget: number | null;
    proteinGm: number | null;
    carbsGm: number | null;
    fatGm: number | null;
    updatedAt: string | null;
    trainer: { name: string } | null;
    meals: Meal[];
  } | null;
  measurements: { id: string; recordedAt: string; weightKg: number | null; bodyFatPct: number | null }[];
  todaysClasses: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    location: string | null;
    booked: number;
    spotsLeft: number;
    full: boolean;
    isBooked: boolean;
  }[];
  announcements: { id: string; title: string; body: string }[];
  verificationNeeded: boolean;
};

const GRADIENT = "bg-gradient-to-br from-gym-lime/20 to-transparent";

type IconProps = React.ComponentProps<typeof Icon>;

function memberProgressPct(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (!s || !e || e <= s) return 100;
  const elapsed = Math.min(Math.max(now - s, 0), e - s);
  return Math.round((elapsed / (e - s)) * 100);
}

function timeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-full bg-gym-lime shadow-glow-sm" />
        <h2 className="heading-condensed text-xl text-white">{children}</h2>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "lime",
}: {
  icon: IconProps["name"];
  label: string;
  value: string;
  sub?: string;
  tone?: "lime" | "white" | "amber";
}) {
  const chip =
    tone === "amber"
      ? "bg-amber-500/15 text-amber-300"
      : tone === "white"
        ? "bg-white/10 text-white/80"
        : "bg-gym-lime/15 text-gym-lime";
  const valueColor = tone === "amber" ? "text-amber-300" : tone === "white" ? "text-white" : "text-gym-lime";
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={cn("pointer-events-none absolute inset-0", GRADIENT)} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="label-kicker">{label}</p>
          <p
            className={cn(
              "mt-3 text-4xl leading-none",
              valueColor === "text-gym-lime" ? "stat-num" : "font-anton italic"
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-2 text-xs text-white/45">{sub}</p>}
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", chip)}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-gym-lime transition hover:gap-2.5 hover:text-gym-lime-soft"
    >
      {children}
      <Icon name="arrowRight" className="h-4 w-4" />
    </Link>
  );
}

function membershipBadge(m: DashboardData["membership"]) {
  if (!m) return { tone: "red" as const, label: "No membership" };
  switch (m.status) {
    case "ACTIVE":
      return { tone: "green" as const, label: `Membership active · ${m.daysRemaining} days left` };
    case "FROZEN":
      return {
        tone: "yellow" as const,
        label: `Frozen · resumes ${formatDate(m.freezeEndsAt ?? m.endDate)}`,
      };
    case "SUSPENDED":
      return { tone: "yellow" as const, label: "Suspended" };
    case "CANCELLED":
      return { tone: "neutral" as const, label: "Cancelled" };
    default:
      return { tone: "red" as const, label: "Membership expired" };
  }
}

function WeekBars({ data }: { data: { date: string; visits: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.visits));
  const dayLabel = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "narrow" });
  return (
    <div className="flex h-20 items-end gap-2">
      {data.map((d) => (
        <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-semibold text-gym-lime">{d.visits || ""}</span>
          <div
            className={cn("w-full rounded-t-sm", d.visits ? "bg-gradient-to-t from-gym-lime-dim to-gym-lime" : "bg-white/10")}
            style={{ height: `${Math.max(d.visits ? 14 : 4, (d.visits / max) * 100)}%` }}
          />
          <span className="text-[10px] text-white/30">{dayLabel(d.date)}</span>
        </div>
      ))}
    </div>
  );
}

export default function MemberDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load + auto-refresh: interval (paused while tab hidden) + refetch on focus
  useEffect(() => {
    let cancelled = false;

    async function refresh(silent: boolean) {
      if (document.hidden && !silent) return;
      try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error("load failed");
        const next = await res.json();
        if (!cancelled) {
          setData(next);
          setError(null);
        }
      } catch {
        if (!cancelled && !silent) setError("Couldn't load your dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    refresh(false);
    const timer = window.setInterval(() => refresh(true), 30000);
    const onVisibility = () => {
      if (!document.hidden) refresh(true);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (loading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const { user, profile, membership, attendance, workoutPlan, joinedCompetitions, dietPlan, measurements, todaysClasses, announcements, verificationNeeded } = data;
  const badge = membershipBadge(membership);
  const active = membership?.status === "ACTIVE";
  const firstName = user.name.split(" ")[0];
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const latestM = measurements[0];
  const prevM = measurements[1];
  const weightChart = [...measurements]
    .reverse()
    .filter((m) => m.weightKg != null)
    .map((m, i) => ({ x: i, y: m.weightKg as number }));
  const weightDelta =
    latestM?.weightKg != null && prevM?.weightKg != null ? latestM.weightKg - prevM.weightKg : null;

  return (
    <div className="space-y-8">
      {/* ── Hero header ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-surface-1 via-gym-black to-gym-black p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gym-lime/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {user.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImageUrl}
                alt={user.name}
                className="h-16 w-16 rounded-2xl border border-gym-lime/30 object-cover shadow-glow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gym-lime/30 bg-gym-lime/10 font-anton text-2xl italic text-gym-lime shadow-glow-sm">
                {initials}
              </div>
            )}
            <div>
              <p className="label-kicker">Member dashboard</p>
              <h1 className="mt-1 font-anton text-3xl uppercase leading-none tracking-wide text-white sm:text-4xl">
                Welcome back, <span className="glow-lime">{firstName}</span>
              </h1>
              {profile?.fitnessGoal && (
                <p className="mt-2 flex items-center gap-2 text-sm text-white/55">
                  <Icon name="target" className="h-4 w-4 text-gym-lime" />
                  Goal: <span className="font-semibold text-white/80">{profile.fitnessGoal}</span>
                </p>
              )}
              {user.memberCode && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-surface-3 px-2 py-0.5 font-mono text-[10px] tracking-wide text-white/55">
                  <Icon name="qrCode" className="h-3 w-3 text-gym-lime" />
                  {user.memberCode}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            {membership ? (
              <Badge tone={badge.tone}>{badge.label}</Badge>
            ) : (
              <Badge tone="red">No membership</Badge>
            )}
            {active && membership && (
              <div className="w-full sm:w-64">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-white/45">Renews {formatDate(membership.endDate)}</span>
                  <span className="font-semibold text-gym-lime">{membership.daysRemaining} days</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gym-lime-dim to-gym-lime shadow-glow-sm"
                    style={{ width: `${Math.min(100, memberProgressPct(membership.startDate, membership.endDate))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Profile verification banner ─────────────────────────── */}
      {verificationNeeded && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <Icon name="flag" className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="font-bold text-amber-200">Profile Verification Pending</p>
            <p className="mt-0.5 text-sm text-amber-100/80">
              Welcome! Your online account is created. Please visit the gym front desk with your
              Aadhaar card to verify your account and complete your registration.
            </p>
          </div>
        </div>
      )}

      {/* ── Announcements ───────────────────────────────────────── */}
      {announcements.length > 0 && (
        <Card className="px-5 py-3">
          <AnnouncementTicker announcements={announcements} />
        </Card>
      )}

      {/* ── Quick links ─────────────────────────────────────────── */}
      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/member/attendance", icon: "activity" as const, label: "Check in" },
          { href: "/member/classes", icon: "users" as const, label: "Classes" },
          { href: "/member/qr", icon: "qrCode" as const, label: "My QR" },
          { href: "/member/profile", icon: "user" as const, label: "Profile" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-surface-2 px-4 py-3.5 transition hover:border-gym-lime/50 hover:bg-surface-3 active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gym-lime/15 text-gym-lime transition group-hover:bg-gym-lime group-hover:text-gym-black">
              <Icon name={l.icon} className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-bold text-white/85 group-hover:text-white">{l.label}</span>
          </Link>
        ))}
      </nav>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon="activity"
          label="Total check-ins"
          value={String(attendance.total)}
          sub={
            attendance.monthVisits > 0
              ? `${attendance.monthVisits} visits this month`
              : attendance.recent.length
                ? `Last visit ${formatDate(attendance.recent[0].checkIn)}`
                : "No visits yet"
          }
        />
        <StatCard
          icon="calendar"
          label="Membership days left"
          value={membership ? String(membership.daysRemaining) : "—"}
          sub={
            membership
              ? active
                ? `Valid till ${formatDate(membership.endDate)}`
                : membership.status === "FROZEN"
                  ? `Frozen till ${formatDate(membership.freezeEndsAt ?? membership.endDate)}`
                  : "Plan not active"
              : "Pick a plan to get started"
          }
        />
        <StatCard
          icon="trophy"
          label="Challenges joined"
          value={String(joinedCompetitions.length)}
          sub={joinedCompetitions.length ? "Keep pushing!" : "Join a challenge"}
          tone={joinedCompetitions.length ? "lime" : "white"}
        />
      </div>

      {/* ── Membership + Check-in ───────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Membership */}
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <SectionTitle>
              My Membership
              {membership && active && (
                <span className="ml-3 hidden text-sm font-semibold normal-case text-gym-lime sm:inline">
                  {membership.plan.name}
                </span>
              )}
            </SectionTitle>
          </div>
          <div className="p-6">
            {membership ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xl font-bold text-white">{membership.plan.name}</p>
                  <p className="font-display text-2xl leading-none text-gym-lime">
                    ₹{membership.plan.price.toLocaleString("en-IN")}
                    <span className="ml-1 font-sans text-xs font-semibold text-white/40">/ {planPeriodLabel(membership.plan.durationDays)}</span>
                  </p>
                </div>
                {membership.plan.description && (
                  <p className="mt-1 text-sm text-white/55">{membership.plan.description}</p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-surface-3 px-4 py-3">
                    <p className="label-kicker">Valid from</p>
                    <p className="mt-1 font-semibold text-white/85">{formatDate(membership.startDate)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-surface-3 px-4 py-3">
                    <p className="label-kicker">Valid till</p>
                    <p className="mt-1 font-semibold text-white/85">{formatDate(membership.endDate)}</p>
                  </div>
                </div>

                {membership.plan.features.length > 0 && (
                  <ul className="mt-5 space-y-2 text-sm text-white/70">
                    {membership.plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gym-lime/15">
                          <Icon name="check" className="h-3 w-3 text-gym-lime" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {membership.status === "EXPIRED" && (
                  <div className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3">
                    <p className="text-sm font-semibold text-red-300">
                      Your membership has expired.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href="/member/pay"
                        className="inline-flex items-center gap-2 rounded-md bg-gym-lime px-4 py-2 text-sm font-bold text-gym-black transition hover:bg-gym-lime-soft active:scale-[0.98]"
                      >
                        Renew now
                        <Icon name="arrowRight" className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={whatsappLink()}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-white/65 underline-offset-4 hover:text-white hover:underline"
                      >
                        Ask on WhatsApp
                      </a>
                    </div>
                  </div>
                )}
                {membership.status === "FROZEN" && (
                  <div className="mt-5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-sm font-semibold text-amber-300">
                      Your membership is frozen. It resumes{" "}
                      {formatDate(membership.freezeEndsAt ?? membership.endDate)}.
                    </p>
                    <p className="mt-1 text-xs text-amber-200/60">
                      Freezes pause your plan without losing remaining days.
                    </p>
                  </div>
                )}
                {(membership.status === "SUSPENDED" || membership.status === "CANCELLED") && (
                  <div className="mt-5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-sm font-semibold text-amber-300">
                      Your membership is {membership.status.toLowerCase()}. Contact the front desk for help.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gym-lime/10 text-gym-lime">
                  <Icon name="card" className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold text-white">No active membership</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-white/55">
                  Choose a plan that fits your goal and start training today.
                </p>
                <Link
                  href="/pricing"
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-gym-lime px-5 py-2.5 text-sm font-bold text-gym-black transition hover:bg-gym-lime-soft active:scale-[0.98]"
                >
                  View plans
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Today's check-in */}
        <Card className="flex flex-col overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <SectionTitle>Today&apos;s check-in</SectionTitle>
          </div>
          <div className="flex flex-1 flex-col p-6">
            {attendance.todayCheckIn ? (
              <div className="flex items-center gap-4 rounded-xl border border-gym-lime/40 bg-gym-lime/10 px-5 py-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gym-lime text-gym-black shadow-glow">
                  <Icon name="check" className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-gym-lime">You&apos;re checked in!</p>
                  <p className="mt-0.5 text-sm text-white/60">
                    Since <span className="font-semibold text-white/85">{timeOnly(attendance.todayCheckIn.checkIn)}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-surface-3 px-5 py-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/60">
                  <Icon name="clock" className="h-5 w-5" />
                </span>
                <p className="mt-3 font-semibold text-white">Not checked in yet</p>
                <p className="mt-1 text-sm text-white/50">
                  Scan your QR at the front desk to start today&apos;s session.
                </p>
              </div>
            )}

            <Link
              href="/member/attendance"
              className={cn(
                "mt-5 inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition active:scale-[0.98]",
                attendance.todayCheckIn
                  ? "border border-gym-lime/60 text-gym-lime hover:bg-gym-lime hover:text-gym-black"
                  : "bg-gym-lime text-gym-black hover:bg-gym-lime-soft"
              )}
            >
              {attendance.todayCheckIn ? "View attendance log" : "Check in now"}
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>

            {/* This week's visits */}
            <div className="mt-6">
              <p className="mb-2 flex items-center gap-2 label-kicker">
                <Icon name="activity" className="h-3.5 w-3.5 text-gym-lime" />
                This week
                <span className="font-semibold text-gym-lime">
                  {attendance.weekVisits.reduce((s, d) => s + d.visits, 0)} visits
                </span>
              </p>
              <div className="rounded-lg border border-white/5 bg-surface-3/60 px-4 py-3">
                <WeekBars data={attendance.weekVisits} />
              </div>
            </div>

            {attendance.recent.length > 0 && (
              <div className="mt-6 flex-1">
                <p className="mb-3 label-kicker">Recent activity</p>
                <ul className="space-y-2">
                  {attendance.recent
                    .slice(0, attendance.recent.length > 4 ? 4 : attendance.recent.length)
                    .map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-3/60 px-4 py-2.5"
                      >
                        <span className="flex items-center gap-2.5 text-sm text-white/75">
                          <Icon name="check" className="h-4 w-4 text-gym-lime" />
                          {formatDate(r.checkIn)}
                        </span>
                        <span className="font-mono text-xs text-white/40">{timeOnly(r.checkIn)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Today's classes ─────────────────────────────────────── */}
      {todaysClasses.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <SectionTitle action={<CardLink href="/member/classes">Book a class</CardLink>}>
              Today&apos;s classes
            </SectionTitle>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {todaysClasses.map((cls) => (
              <div
                key={cls.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5",
                  cls.isBooked
                    ? "border-gym-lime/40 bg-gym-lime/10"
                    : "border-white/10 bg-surface-3"
                )}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">{cls.name}</p>
                  <p className="mt-0.5 text-xs text-white/55">
                    {cls.startTime} - {cls.endTime}
                    {cls.location ? ` · ${cls.location}` : ""}
                  </p>
                  <p className={cn("mt-1 text-xs", cls.full ? "text-red-300" : "text-white/40")}>
                    {cls.isBooked
                      ? "You're booked ✓"
                      : cls.full
                        ? "Full"
                        : `${cls.spotsLeft} spot${cls.spotsLeft === 1 ? "" : "s"} left`}
                  </p>
                </div>
                {!cls.isBooked && !cls.full && (
                  <Link
                    href="/member/classes"
                    className="shrink-0 rounded-md bg-gym-lime px-3 py-1.5 text-xs font-bold text-gym-black transition hover:bg-gym-lime-soft active:scale-95"
                  >
                    Book
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Diet plan + Progress snapshot ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Diet summary */}
        {dietPlan && (
          <Card className="overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4">
              <SectionTitle>My diet plan</SectionTitle>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{dietPlan.title}</h3>
                  {dietPlan.goal && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-gym-lime">{dietPlan.goal}</p>
                  )}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gym-lime/15 text-gym-lime">
                  <Icon name="leaf" className="h-5 w-5" />
                </div>
              </div>
              {dietPlan.description && <p className="mt-3 text-sm text-white/60">{dietPlan.description}</p>}

              <div className="mt-4 grid grid-cols-4 gap-1 text-center bg-gym-black p-2 rounded text-xs">
                <div>
                  <p className="text-white/40">Kcal</p>
                  <p className="font-bold text-white">{dietPlan.calorieTarget || "—"}</p>
                </div>
                <div>
                  <p className="text-white/40">Protein</p>
                  <p className="font-bold text-gym-lime">{dietPlan.proteinGm ? `${dietPlan.proteinGm}g` : "—"}</p>
                </div>
                <div>
                  <p className="text-white/40">Carbs</p>
                  <p className="font-bold text-amber-400">{dietPlan.carbsGm ? `${dietPlan.carbsGm}g` : "—"}</p>
                </div>
                <div>
                  <p className="text-white/40">Fat</p>
                  <p className="font-bold text-red-400">{dietPlan.fatGm ? `${dietPlan.fatGm}g` : "—"}</p>
                </div>
              </div>

              {dietPlan.meals.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {dietPlan.meals.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs border-l-2 border-gym-lime pl-2 py-0.5">
                      <span className="font-semibold text-white/80">
                        {m.mealName}
                        {m.timing ? <span className="text-white/40"> · {m.timing}</span> : null}
                      </span>
                      {m.calories && <span className="font-mono text-white/40">{m.calories} kcal</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-white/10 pt-4">
                <CardLink href="/member/diet">View full plan</CardLink>
              </div>
            </div>
          </Card>
        )}

        {/* Progress snapshot */}
        {latestM && latestM.weightKg != null && (
          <Card className="overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4">
              <SectionTitle>Progress</SectionTitle>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="label-kicker">
                    Latest weight · {formatDate(latestM.recordedAt)}
                  </p>
                  <p className="mt-2 font-display text-4xl font-bold text-gym-lime">
                    {latestM.weightKg}
                    <span className="ml-1 font-sans text-sm font-semibold text-white/40">kg</span>
                  </p>
                </div>
                {weightDelta != null && (
                  <Badge tone={weightDelta <= 0 ? "green" : "neutral"}>
                    {weightDelta > 0 ? "+" : ""}
                    {weightDelta.toFixed(1)} kg since last
                  </Badge>
                )}
              </div>
              {latestM.bodyFatPct != null && (
                <p className="mt-2 text-xs text-white/45">
                  Body fat: <span className="font-semibold text-white/75">{latestM.bodyFatPct}%</span>
                </p>
              )}
              <div className="mt-4">
                <MiniLineChart color="#9AD901" data={weightChart} />
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <CardLink href="/member/measurements">See all measurements</CardLink>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ── Workout plan ────────────────────────────────────────── */}
      {workoutPlan && (
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <SectionTitle
              action={
                workoutPlan.trainer && (
                  <span className="text-sm text-white/55">
                    by <span className="font-semibold text-gym-lime">{workoutPlan.trainer.name}</span>
                  </span>
                )
              }
            >
              My workout plan
            </SectionTitle>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gym-lime/15 text-gym-lime">
                <Icon name="dumbbell" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">{workoutPlan.title}</h3>
                {workoutPlan.goal && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-gym-lime">{workoutPlan.goal}</p>
                )}
              </div>
            </div>
            {workoutPlan.description && <p className="mt-3 text-sm text-white/60">{workoutPlan.description}</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {workoutPlan.exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="group flex items-start gap-3 rounded-xl border border-white/10 bg-surface-3 px-4 py-3.5 transition hover:border-gym-lime/40"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 font-anton text-sm italic text-gym-lime">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{ex.exerciseName}</p>
                    <p className="mt-0.5 text-sm text-white/55">
                      {ex.sets ? `${ex.sets} sets` : ""}
                      {ex.reps ? ` × ${ex.reps} reps` : ""}
                      {ex.duration ? ` · ${ex.duration}` : ""}
                      {ex.restSeconds ? ` · ${ex.restSeconds}s rest` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ── Challenges ──────────────────────────────────────────── */}
      {joinedCompetitions.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <SectionTitle>My challenges</SectionTitle>
          </div>
          <div className="divide-y divide-white/5 p-6 pt-2">
            {joinedCompetitions.slice(0, 3).map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3 py-3 first:border-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gym-lime/10 text-gym-lime">
                    <Icon name="trophy" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{j.competition.title}</p>
                    {j.competition.endDate && (
                      <p className="text-xs text-white/45">ends {formatDate(j.competition.endDate)}</p>
                    )}
                  </div>
                </div>
                <Badge tone={j.competition.status === "PUBLISHED" ? "green" : "neutral"}>
                  {j.competition.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}