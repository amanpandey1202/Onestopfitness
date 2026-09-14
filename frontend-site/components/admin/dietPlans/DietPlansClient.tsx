"use client";

import { useEffect, useState } from "react";
import { Button, PageHeader, Spinner } from "@/components/admin/ui";
import { formatDate, timeAgo } from "@/lib/format";
import DietPlanEditor, {
  type DietEditorCopyPlan,
  type DietEditorMember,
  type DietEditorTrainer,
} from "@/components/diet/DietPlanEditor";

export type DietPlan = {
  id: string;
  title: string;
  goal: string | null;
  calorieTarget: number | null;
  proteinGm: number | null;
  carbsGm: number | null;
  fatGm: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  member: { id: string; name: string; memberCode: string | null };
  trainer: { id: string; name: string } | null;
  meals: { id: string; mealName: string; timing: string | null; items: string; calories: number | null; orderIndex: number; dayOfWeek: number | null }[];
};

export default function DietPlansClient({
  initialPlans,
  initialMembers,
  initialTrainers,
}: {
  initialPlans: DietPlan[] | null;
  initialMembers: DietEditorMember[] | null;
  initialTrainers: DietEditorTrainer[] | null;
}) {
  const [plans, setPlans] = useState<DietPlan[]>(initialPlans ?? []);
  const [members, setMembers] = useState<DietEditorMember[]>(initialMembers ?? []);
  const [trainers, setTrainers] = useState<DietEditorTrainer[]>(initialTrainers ?? []);
  const [loading, setLoading] = useState(initialPlans === null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DietPlan | null>(null);

  useEffect(() => {
    if (initialPlans !== null) return;
    Promise.all([
      fetch("/api/admin/diet-plans").then((r) => r.json()),
      fetch("/api/admin/members").then((r) => r.json()),
      fetch("/api/admin/trainers").then((r) => r.json()),
    ])
      .then(([dietData, memberData, trainerData]) => {
        setPlans(dietData.plans ?? []);
        setMembers(
          (memberData.members ?? []).map((m: { id: string; name: string; memberCode?: string | null; phone?: string | null }) => ({
            id: m.id,
            name: m.name,
            memberCode: m.memberCode,
            phone: m.phone,
          }))
        );
        setTrainers(
          (trainerData.trainers ?? [])
            .filter((t: { role: string }) => t.role === "TRAINER")
            .map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))
        );
      })
      .finally(() => setLoading(false));
  }, [initialPlans]);

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

  async function toggleActive(plan: DietPlan) {
    await fetch(`/api/admin/diet-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    });
    refreshPlans();
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this diet plan?")) return;
    const res = await fetch(`/api/admin/diet-plans/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPlans(plans.filter((p) => p.id !== id));
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not delete diet plan.");
    }
  }

  async function refreshPlans() {
    const d = await fetch("/api/admin/diet-plans").then((r) => r.json());
    setPlans(d.plans ?? []);
  }

  async function handleSave(payload: Record<string, unknown>) {
    const res = editing
      ? await fetch(`/api/admin/diet-plans/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/diet-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Could not save diet plan.");
    }
    await refreshPlans();
    setShowModal(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Diet &amp; Nutrition Plans"
        subtitle="Assign personalized calorie, macro, and weekly meal schedules to members."
        action={<Button onClick={openCreate}>+ Create Diet Plan</Button>}
      />

      <div className="g3">
        {plans.map((plan) => (
          <div key={plan.id} className="dc" style={!plan.isActive ? { opacity: 0.6 } : undefined}>
            <div className="row btw" style={{ alignItems: "flex-start" }}>
              <div>
                <div className="dct">{plan.title}</div>
                <div className="dcm">For: {plan.member?.name}</div>
                {plan.trainer && (
                  <p className="txs tft" style={{ marginTop: 2 }}>by {plan.trainer.name}</p>
                )}
                <div style={{ marginTop: 6 }}>
                  {plan.isActive ? <span className="badge g">Active</span> : <span className="badge n">Inactive</span>}
                </div>
              </div>
              <div className="row g3">
                <button className="ab" onClick={() => openEdit(plan)}>Edit</button>
                <button className="ab d" onClick={() => deletePlan(plan.id)}>Delete</button>
              </div>
            </div>

            <div className="mg">
              <div>
                <div className="mgl">Kcal</div>
                <div className="mgv w">{plan.calorieTarget ?? "—"}</div>
              </div>
              <div>
                <div className="mgl">Protein</div>
                <div className="mgv l">{plan.proteinGm != null ? `${plan.proteinGm}g` : "—"}</div>
              </div>
              <div>
                <div className="mgl">Carbs</div>
                <div className="mgv a">{plan.carbsGm != null ? `${plan.carbsGm}g` : "—"}</div>
              </div>
              <div>
                <div className="mgl">Fat</div>
                <div className="mgv r">{plan.fatGm != null ? `${plan.fatGm}g` : "—"}</div>
              </div>
            </div>

            <div className="ml">
              <div className="tft" style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                Meals ({plan.meals.length})
              </div>
              {plan.meals.slice(0, 4).map((m) => (
                <div key={m.id} className="mi">
                  <div>
                    <div className="mn">{m.mealName}</div>
                    <div className="mti">{m.timing || "Anytime"}</div>
                  </div>
                </div>
              ))}
              {plan.meals.length > 4 && (
                <p className="txs tft" style={{ marginTop: 4 }}>+{plan.meals.length - 4} more meals</p>
              )}
            </div>

            <div className="of" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--abd)" }}>
              <span className="txs tft">{timeAgo(plan.updatedAt) || formatDate(plan.updatedAt)}</span>
              <button className="ab l" onClick={() => toggleActive(plan)}>
                {plan.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-gym-ink p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 font-display text-xl font-bold uppercase text-white">
              {editing ? "Edit Diet Plan" : "Create Diet Plan"}
            </h2>
            <DietPlanEditor
              members={members}
              trainers={trainers}
              copyPlans={copyPlans}
              bulk={!editing}
              initial={
                editing
                  ? {
                      id: editing.id,
                      memberId: editing.member.id,
                      trainerId: editing.trainer ? editing.trainer.id : null,
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