"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, Input, PageHeader, Select, Spinner, TextArea } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type DietPlan = {
  id: string;
  title: string;
  goal: string | null;
  calorieTarget: number | null;
  proteinGm: number | null;
  carbsGm: number | null;
  fatGm: number | null;
  createdAt: string;
  member: { name: string };
  meals: { id: string; mealName: string; timing: string | null; items: string; calories: number | null }[];
};

type Member = { id: string; name: string };

export default function AdminDietPlansPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("Fat Loss");
  const [calorieTarget, setCalorieTarget] = useState("2000");
  const [proteinGm, setProteinGm] = useState("150");
  const [carbsGm, setCarbsGm] = useState("200");
  const [fatGm, setFatGm] = useState("65");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  // Default meal items
  const [meals] = useState([
    { mealName: "Breakfast", timing: "08:00 AM", items: JSON.stringify([{ name: "Oats with Milk", quantity: "60g" }, { name: "Egg Whites", quantity: "4 whole" }]), calories: 450 },
    { mealName: "Lunch", timing: "01:30 PM", items: JSON.stringify([{ name: "Grilled Chicken/Paneer", quantity: "150g" }, { name: "Brown Rice", quantity: "1 cup" }]), calories: 550 },
    { mealName: "Evening Snack", timing: "05:30 PM", items: JSON.stringify([{ name: "Whey Protein Shake", quantity: "1 scoop" }, { name: "Almonds", quantity: "10 pcs" }]), calories: 250 },
    { mealName: "Dinner", timing: "08:30 PM", items: JSON.stringify([{ name: "Fish/Tofu Curry", quantity: "150g" }, { name: "Mixed Salad", quantity: "1 bowl" }]), calories: 400 },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/diet-plans").then((r) => r.json()),
      fetch("/api/admin/members").then((r) => r.json()),
    ])
      .then(([dietData, memberData]) => {
        setPlans(dietData.plans ?? []);
        setMembers(memberData.members ?? []);
        if (memberData.members?.length > 0) setMemberId(memberData.members[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/diet-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          title,
          goal,
          calorieTarget: Number(calorieTarget) || null,
          proteinGm: Number(proteinGm) || null,
          carbsGm: Number(carbsGm) || null,
          fatGm: Number(fatGm) || null,
          description: description || null,
          meals,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        const d = await fetch("/api/admin/diet-plans").then((r) => r.json());
        setPlans(d.plans ?? []);
      }
    } finally {
      setBusy(false);
    }
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this diet plan?")) return;
    await fetch(`/api/admin/diet-plans/${id}`, { method: "DELETE" });
    setPlans(plans.filter((p) => p.id !== id));
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Diet &amp; Nutrition Plans"
        subtitle="Assign personalized calorie, macro, and meal schedules to members."
        action={
          <Button onClick={() => setShowModal(true)}>+ Create Diet Plan</Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-display text-lg font-bold text-white uppercase">{plan.title}</h3>
                <Button variant="danger" className="py-0.5 px-2 text-xs" onClick={() => deletePlan(plan.id)}>Delete</Button>
              </div>
              <p className="text-xs font-semibold text-gym-lime">For: {plan.member?.name}</p>
              {plan.goal && <p className="text-xs text-white/50 mt-1">Goal: {plan.goal}</p>}

              <div className="mt-4 grid grid-cols-4 gap-1 text-center bg-gym-black p-2 rounded text-xs">
                <div>
                  <p className="text-white/40">Kcal</p>
                  <p className="font-bold text-white">{plan.calorieTarget || "—"}</p>
                </div>
                <div>
                  <p className="text-white/40">Protein</p>
                  <p className="font-bold text-gym-lime">{plan.proteinGm ? `${plan.proteinGm}g` : "—"}</p>
                </div>
                <div>
                  <p className="text-white/40">Carbs</p>
                  <p className="font-bold text-amber-400">{plan.carbsGm ? `${plan.carbsGm}g` : "—"}</p>
                </div>
                <div>
                  <p className="text-white/40">Fat</p>
                  <p className="font-bold text-red-400">{plan.fatGm ? `${plan.fatGm}g` : "—"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/40">Meals ({plan.meals.length})</p>
                {plan.meals.map((m) => (
                  <div key={m.id} className="text-xs border-l-2 border-gym-lime pl-2 py-0.5">
                    <p className="font-bold text-white">{m.mealName} <span className="text-gym-lime font-normal">({m.timing})</span></p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-white/30 text-right">Created {formatDate(plan.createdAt)}</p>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-gym-ink p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-bold uppercase text-white">Create Diet Plan</h2>
            <form onSubmit={createPlan} className="space-y-4">
              <Field label="Assign Member">
                <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Plan Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2000 kcal Fat Loss Plan" required />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fitness Goal">
                  <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Fat Loss / Muscle Gain" />
                </Field>
                <Field label="Calorie Target">
                  <Input type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Protein (g)">
                  <Input type="number" value={proteinGm} onChange={(e) => setProteinGm(e.target.value)} />
                </Field>
                <Field label="Carbs (g)">
                  <Input type="number" value={carbsGm} onChange={(e) => setCarbsGm(e.target.value)} />
                </Field>
                <Field label="Fat (g)">
                  <Input type="number" value={fatGm} onChange={(e) => setFatGm(e.target.value)} />
                </Field>
              </div>

              <Field label="Notes / Guidelines">
                <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Drink 4L water daily, avoid sugar..." rows={2} />
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy ? "Creating..." : "Save Diet Plan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
