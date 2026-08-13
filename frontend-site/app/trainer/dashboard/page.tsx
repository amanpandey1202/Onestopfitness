"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type TrainerData = {
  trainer: { id: string; name: string; email: string; phone: string | null; profileImageUrl: string | null };
  profile: {
    specialization: string;
    bio: string | null;
    experience: number | null;
    instagram: string | null;
  } | null;
  stats: { workoutPlans: number; membersCoached: number };
  workoutPlans: {
    id: string;
    title: string;
    goal: string | null;
    description: string | null;
    updatedAt: string;
    member: { id: string; name: string };
    exercises: { id: string; exerciseName: string }[];
  }[];
};

export default function TrainerDashboardPage() {
  const [data, setData] = useState<TrainerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trainer")
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

  const { trainer, profile, stats, workoutPlans } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
            Coach <span className="text-gym-lime">{trainer.name.split(" ")[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {profile?.specialization}
            {profile?.experience ? ` · ${profile.experience} years experience` : ""}
          </p>
        </div>
        <Badge tone="green">Trainer</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Workout plans created</p>
          <p className="mt-2 font-display text-3xl font-bold text-gym-lime">{stats.workoutPlans}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Members coached</p>
          <p className="mt-2 font-display text-3xl font-bold text-gym-lime">{stats.membersCoached}</p>
        </Card>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">My Workout Plans</h2>
        {workoutPlans.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No workout plans yet">
              Plans you write for members will appear here.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {workoutPlans.map((plan) => (
              <Card key={plan.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white">{plan.title}</h3>
                  <Badge tone="neutral">for {plan.member.name}</Badge>
                </div>
                {plan.goal && <p className="mt-1 text-sm font-semibold text-gym-lime">{plan.goal}</p>}
                {plan.description && <p className="mt-1 text-sm text-white/55">{plan.description}</p>}
                <p className="mt-2 text-xs text-white/40">
                  {plan.exercises.length} exercises · updated {formatDate(plan.updatedAt)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {profile?.bio && (
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">About me</p>
          <p className="mt-2 text-sm text-white/65">{profile.bio}</p>
        </Card>
      )}
    </div>
  );
}
