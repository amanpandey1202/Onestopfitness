"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
import { timeAgo } from "@/lib/format";
import DietPlanEditor, {
  type DietEditorCopyPlan,
  type DietEditorMember,
} from "@/components/diet/DietPlanEditor";

type PlanMeal = {
  id: string;
  mealName: string;
  timing: string | null;
  items: string;
  calories: number | null;
  dayOfWeek: number | null;
};

type DietPlan = {
  id: string;
  title: string;
  goal: string | null;
  calorieTarget: number | null;
  proteinGm: number | null;
  carbsGm: number | null;
  fatGm: number | null;
  description: string | null;
  updatedAt: string;
  member: { id: string; name: string; memberCode: string | null };
  meals: PlanMeal[];
};

export default function TrainerDietPlansPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [members, setMembers] = useState<DietEditorMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DietPlan | null>(null);

  async function loadAll() {
    const planRes = await fetch("/api/trainer/diet-plans");
    const memberRes = await fetch("/api/trainer/members");
    if (planRes.status === 401) {
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    if (!planRes.ok || !memberRes.ok) throw new Error("Failed to load diet plans");
    const [planData, memberData] = await Promise.all([planRes.json(), memberRes.json()]);
    return { plans: planData.plans ?? [], members: memberData.allMembers ?? [] };
  }

  useEffect(() => {
    loadAll()
      .then(({ plans, members }) => {
        setPlans(plans);
        setMembers(members);
      })
      .catch(() => setError("Could not load your diet plans. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const copyPlans: DietEditorCopyPlan[] = plans.map((p) => ({
    id: p.id,
    title: p.title,
    meals: p.meals.map((m) => ({
      mealName: m.mealName,
      timing: m.timing,
      calories: m.calories,
      items: m.items,
      dayOfWeek: m.dayOfWeek,
    })),
  }));

  function openCreate() {
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(plan: DietPlan) {
    setEditing(plan);
    setShowModal(true);
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this diet plan?")) return;
    const res = await fetch(`/api/trainer/diet-plans/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPlans(plans.filter((p) => p.id !== id));
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not delete diet plan.");
    }
  }

  async function handleSave(payload: Record<string, unknown>) {
    const res = editing
      ? await fetch(`/api/trainer/diet-plans/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/trainer/diet-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Could not save diet plan.");
    }
    const reloaded = await loadAll();
    setPlans(reloaded.plans);
    setMembers(reloaded.members);
    setShowModal(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader title="My Diet Plans" subtitle="Write personalised weekly meal plans for your members." />
        <Card className="p-10 text-center border-red-400/40">
          <p className="text-white/70">{error}</p>
          <p className="mt-2 text-xs text-white/30">If this keeps happening, contact the gym.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Diet Plans"
        subtitle="Write personalised weekly meal plans for your members."
        action={<Button onClick={openCreate}>+ Create Diet Plan</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Diet plans created</p>
          <p className="mt-2 font-display text-3xl font-bold text-gym-lime">{plans.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Members on a diet plan</p>
          <p className="mt-2 font-display text-3xl font-bold text-gym-lime">
            {new Set(plans.map((p) => p.member.id)).size}
          </p>
        </Card>
      </div>

      {plans.length === 0 ? (
        <EmptyState title="You haven't created any diet plans yet">
          <button onClick={openCreate} className="mt-1 font-bold text-gym-lime hover:underline">
            Create your first plan →
          </button>
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col justify-between p-6 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-bold uppercase text-white">{plan.title}</h3>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" className="px-2 py-0.5 text-xs" onClick={() => openEdit(plan)}>
                      Edit
                    </Button>
                    <Button variant="danger" className="px-2 py-0.5 text-xs" onClick={() => deletePlan(plan.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gym-lime">For: {plan.member.name}</p>
                {plan.member.memberCode && (
                  <p className="font-mono text-[10px] text-white/30">#{plan.member.memberCode}</p>
                )}
                {plan.goal && <p className="mt-1 text-xs text-white/50">Goal: {plan.goal}</p>}

                {plan.calorieTarget != null && (
                  <div className="mt-3">
                    <Badge tone="green">{plan.calorieTarget} kcal/day</Badge>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-4 gap-1 rounded bg-gym-black p-2 text-center text-xs">
                  <div>
                    <p className="text-white/40">Protein</p>
                    <p className="font-bold text-gym-lime">{plan.proteinGm != null ? `${plan.proteinGm}g` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/40">Carbs</p>
                    <p className="font-bold text-amber-400">{plan.carbsGm != null ? `${plan.carbsGm}g` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/40">Fat</p>
                    <p className="font-bold text-red-400">{plan.fatGm != null ? `${plan.fatGm}g` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/40">Days</p>
                    <p className="font-bold text-white">
                      {plan.meals.length === 0
                        ? "—"
                        : plan.meals.some((m) => m.dayOfWeek === null)
                          ? "7"
                          : new Set(plan.meals.map((m) => m.dayOfWeek)).size}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-white/30">Updated {timeAgo(plan.updatedAt)}</p>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-gym-ink p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 font-display text-xl font-bold uppercase text-white">
              {editing ? "Edit Diet Plan" : "Create Diet Plan"}
            </h2>
            <DietPlanEditor
              members={members}
              copyPlans={copyPlans}
              initial={
                editing
                  ? {
                      id: editing.id,
                      memberId: editing.member.id,
                      title: editing.title,
                      goal: editing.goal,
                      description: editing.description,
                      calorieTarget: editing.calorieTarget,
                      proteinGm: editing.proteinGm,
                      carbsGm: editing.carbsGm,
                      fatGm: editing.fatGm,
                      meals: editing.meals.map((m) => ({
                        mealName: m.mealName,
                        timing: m.timing,
                        calories: m.calories,
                        items: m.items,
                        dayOfWeek: m.dayOfWeek,
                      })),
                    }
                  : null
              }
              onSave={handleSave}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}