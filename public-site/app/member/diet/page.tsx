"use client";

import { useEffect, useState } from "react";
import { Badge, Card, Spinner } from "@/components/admin/ui";

type Meal = {
  id: string;
  mealName: string;
  timing: string | null;
  items: string;
  calories: number | null;
  orderIndex: number;
};

type DietPlan = {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  calorieTarget: number | null;
  proteinGm: number | null;
  carbsGm: number | null;
  fatGm: number | null;
  trainer: { name: string } | null;
  meals: Meal[];
};

function parseMealItems(json: string): { name: string; quantity: string; calories?: number }[] {
  try {
    const val = JSON.parse(json);
    return Array.isArray(val) ? val : [{ name: json, quantity: "" }];
  } catch {
    return [{ name: json, quantity: "" }];
  }
}

export default function MemberDietPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/diet")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
          Diet Plan
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Your personalised nutrition plan from your trainer.
        </p>
      </div>

      {plans.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-white/50">No diet plan assigned yet.</p>
          <p className="mt-2 text-xs text-white/30">Ask your trainer to create one for you.</p>
        </Card>
      ) : (
        plans.map((plan) => (
          <div key={plan.id} className="space-y-4">
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold uppercase text-white">{plan.title}</h2>
                  {plan.goal && <p className="mt-1 text-sm font-semibold text-gym-lime">{plan.goal}</p>}
                  {plan.trainer && (
                    <p className="text-xs text-white/45">by {plan.trainer.name}</p>
                  )}
                  {plan.description && (
                    <p className="mt-2 text-sm text-white/60">{plan.description}</p>
                  )}
                </div>
                {plan.calorieTarget && (
                  <Badge tone="green">{plan.calorieTarget} kcal/day</Badge>
                )}
              </div>

              {(plan.proteinGm || plan.carbsGm || plan.fatGm) && (
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                  {plan.proteinGm && (
                    <div className="rounded-lg border border-white/10 bg-gym-black p-3">
                      <p className="text-xs text-white/40">Protein</p>
                      <p className="font-bold text-gym-lime">{plan.proteinGm}g</p>
                    </div>
                  )}
                  {plan.carbsGm && (
                    <div className="rounded-lg border border-white/10 bg-gym-black p-3">
                      <p className="text-xs text-white/40">Carbs</p>
                      <p className="font-bold text-amber-400">{plan.carbsGm}g</p>
                    </div>
                  )}
                  {plan.fatGm && (
                    <div className="rounded-lg border border-white/10 bg-gym-black p-3">
                      <p className="text-xs text-white/40">Fat</p>
                      <p className="font-bold text-red-400">{plan.fatGm}g</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {plan.meals.map((meal) => {
              const items = parseMealItems(meal.items);
              return (
                <Card key={meal.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white">{meal.mealName}</h3>
                      {meal.timing && (
                        <p className="text-xs text-gym-lime">{meal.timing}</p>
                      )}
                    </div>
                    {meal.calories && (
                      <Badge tone="neutral">{meal.calories} kcal</Badge>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gym-lime" />
                        <span>
                          <span className="font-medium text-white">{item.name}</span>
                          {item.quantity && <span className="text-white/45"> — {item.quantity}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
