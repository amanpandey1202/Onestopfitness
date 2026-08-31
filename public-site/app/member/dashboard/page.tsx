"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Badge, Card, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type DashboardData = {
  user: { id: string; name: string; email: string; phone: string | null; profileImageUrl: string | null };
  profile: { fitnessGoal: string | null; joiningDate: string | null } | null;
  membership: {
    id: string;
    plan: { name: string; price: number; description: string | null; features: string[] };
    startDate: string;
    endDate: string;
    status: string;
    daysRemaining: number;
  } | null;
  attendance: {
    total: number;
    todayCheckIn: { id: string; checkIn: string } | null;
    recent: { id: string; checkIn: string; method: string }[];
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
};

export default function MemberDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then(setData)
      .catch(() => setError("Couldn't load your dashboard."));
  }, []);

  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const { user, profile, membership, attendance, workoutPlan, joinedCompetitions } = data;
  const active = membership?.status === "ACTIVE";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
            Welcome, <span className="text-gym-lime">{user.name.split(" ")[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {profile?.fitnessGoal ? `Goal: ${profile.fitnessGoal}` : "Let's get to work."}
          </p>
        </div>
        {membership ? (
          <Badge tone={active ? "green" : "red"}>
            {active ? `Membership active · ${membership.daysRemaining} days left` : "Membership expired"}
          </Badge>
        ) : (
          <Badge tone="red">No membership</Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 active:scale-[0.99]">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Total check-ins</p>
          <p className="stat-num mt-2 text-3xl uppercase">{attendance.total}</p>
        </Card>
        <Card className="p-5 active:scale-[0.99]">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Membership days left</p>
          <p className="stat-num mt-2 text-3xl uppercase">
            {membership ? membership.daysRemaining : "—"}
          </p>
        </Card>
        <Card className="p-5 active:scale-[0.99]">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Challenges joined</p>
          <p className="stat-num mt-2 text-3xl uppercase">{joinedCompetitions.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Membership */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">My Membership</h2>
          {membership ? (
            <>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-xl font-bold text-white">{membership.plan.name}</p>
                <p className="text-gym-lime">₹{membership.plan.price.toLocaleString("en-IN")}/mo</p>
              </div>
              {membership.plan.description && (
                <p className="mt-1 text-sm text-white/70">{membership.plan.description}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-white/60">Valid from</p>
                  <p className="font-semibold text-white/85">{formatDate(membership.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Valid till</p>
                  <p className="font-semibold text-white/85">{formatDate(membership.endDate)}</p>
                </div>
              </div>
              {membership.plan.features.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm text-white/70">
                  {membership.plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-gym-lime" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              {!active && (
                <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  Your membership has expired. Message us on WhatsApp to renew.
                </p>
              )}
            </>
          ) : (
<p className="mt-4 text-sm text-white/70">
            You don&apos;t have an active membership yet.{" "}
            <Link href="/pricing" className="font-bold text-gym-lime hover:underline">
              View plans
            </Link>
          </p>
          )}
        </Card>

        {/* Check-in status */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">Today&apos;s Check-in</h2>
          <div className="mt-4">
            {attendance.todayCheckIn ? (
              <div className="flex items-center gap-3 rounded-lg border border-gym-lime/40 bg-gym-lime/10 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gym-lime text-gym-black">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-gym-lime">You&apos;re checked in!</p>
                  <p className="text-sm text-white/60">
                    Since {new Date(attendance.todayCheckIn.checkIn).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/15 px-4 py-3">
                <p className="text-sm text-white/60">You haven&apos;t checked in today.</p>
              </div>
            )}
<Link
            href="/member/attendance"
            className="mt-4 inline-block rounded-md bg-gym-lime px-4 py-2 text-sm font-bold text-gym-black transition hover:bg-gym-lime-soft active:scale-95"
          >
            {attendance.todayCheckIn ? "View Attendance" : "Check In Now"}
          </Link>
          </div>

          {attendance.recent.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Recent check-ins</p>
              <ul className="mt-2 space-y-1.5 text-sm text-white/70">
                {attendance.recent.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <Icon name="check" className="h-4 w-4 shrink-0 text-gym-lime" />
                    <span className="flex-1 pl-2">{formatDate(r.checkIn)}</span>
                    <span className="text-white/40">
                      {new Date(r.checkIn).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Workout plan */}
      {workoutPlan && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
              My Workout Plan
            </h2>
            {workoutPlan.trainer && (
              <p className="text-sm text-white/55">by <span className="font-semibold text-gym-lime">{workoutPlan.trainer.name}</span></p>
            )}
          </div>
          <h3 className="mt-3 text-xl font-bold text-white">{workoutPlan.title}</h3>
          {workoutPlan.goal && <p className="text-sm font-semibold text-gym-lime">{workoutPlan.goal}</p>}
          {workoutPlan.description && <p className="mt-1 text-sm text-white/60">{workoutPlan.description}</p>}
          {workoutPlan.exercises.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {workoutPlan.exercises.map((ex) => (
                <div key={ex.id} className="rounded-lg border border-white/10 bg-gym-black px-4 py-3">
                  <p className="font-semibold text-white">{ex.exerciseName}</p>
                  <p className="text-sm text-white/70">
                    {ex.sets ? `${ex.sets} sets` : ""}
                    {ex.reps ? ` × ${ex.reps} reps` : ""}
                    {ex.duration ? ` · ${ex.duration}` : ""}
                    {ex.restSeconds ? ` · ${ex.restSeconds}s rest` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/70">
              Your trainer hasn&apos;t added exercises yet — check back soon.
            </p>
          )}
        </Card>
      )}

      {/* Competitions */}
      {joinedCompetitions.length > 0 && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">My Challenges</h2>
          <div className="mt-3 space-y-2">
            {joinedCompetitions.map((j) => (
              <div key={j.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-gym-black px-4 py-3">
                <p className="font-semibold text-white">{j.competition.title}</p>
                <div className="flex items-center gap-3">
                  {j.competition.endDate && (
                    <span className="text-xs text-white/45">ends {formatDate(j.competition.endDate)}</span>
                  )}
                  <Badge tone={j.competition.status === "PUBLISHED" ? "green" : "neutral"}>
                    {j.competition.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
