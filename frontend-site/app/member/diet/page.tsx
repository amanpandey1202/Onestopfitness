"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/admin/ui";
import { timeAgo } from "@/lib/format";
import Icon from "@/components/Icon";
import {
  DAY_LABELS,
  DAY_LABELS_SHORT,
  mealsForDayPriority,
  parseDietItems,
  type DietMealLike,
} from "@/lib/diet";

type DietPlan = {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  calorieTarget: number | null;
  proteinGm: number | null;
  carbsGm: number | null;
  fatGm: number | null;
  updatedAt: string | null;
  trainer: { name: string } | null;
  meals: DietMealLike[];
};

export default function MemberDietPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [activeDay, setActiveDay] = useState(() => new Date().getDay());

  useEffect(() => {
    fetch("/api/me/diet")
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          throw new Error("Session expired");
        }
        if (!r.ok) throw new Error("Failed to load diet plan");
        return r.json() as Promise<{ plans?: DietPlan[] }>;
      })
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => setError("Could not load your diet plan. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const planIndex = Math.min(activePlanIdx, Math.max(0, plans.length - 1));
  const plan = plans[planIndex];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gym-lime">Member Portal</p>
          <h1 className="mt-1 font-anton text-4xl uppercase leading-none tracking-wide text-white">Diet Plan</h1>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-400/20 bg-red-500/10 py-12 text-center">
          <Icon name="close" className="h-10 w-10 text-red-400/60" />
          <div>
            <p className="font-semibold text-red-300">{error}</p>
            <p className="mt-1 text-xs text-white/30">If this keeps happening, contact the gym.</p>
          </div>
        </div>
      </div>
    );
  }

  if (plans.length === 0 || !plan) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gym-lime">Member Portal</p>
          <h1 className="mt-1 font-anton text-4xl uppercase leading-none tracking-wide text-white">Diet Plan</h1>
          <p className="mt-2 text-sm text-white/50">Your personalised nutrition plan from your trainer.</p>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-surface-2 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gym-lime/10 text-gym-lime/60">
            <Icon name="leaf" className="h-8 w-8" />
          </span>
          <div>
            <p className="font-semibold text-white/70">No diet plan yet</p>
            <p className="mt-1 text-sm text-white/35">
              Your trainer hasn&apos;t assigned a diet plan yet.
              <br />Check back after your next session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const todayIndex = new Date().getDay();
  const dayMeals = mealsForDayPriority(plan.meals, activeDay);

  /* Macro colours */
  const macros = [
    { label: "Calories", value: plan.calorieTarget, unit: "kcal", color: "#9AD901" },
    { label: "Protein",  value: plan.proteinGm,    unit: "g",    color: "#38bdf8" },
    { label: "Carbs",    value: plan.carbsGm,      unit: "g",    color: "#f59e0b" },
    { label: "Fat",      value: plan.fatGm,        unit: "g",    color: "#ef4444" },
  ];

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gym-lime">Member Portal</p>
        <h1 className="mt-1 font-anton text-4xl uppercase leading-none tracking-wide text-white">
          Diet Plan
        </h1>
        <p className="mt-2 text-sm text-white/50">Your personalised nutrition plan from your trainer.</p>
      </div>

      {/* ── Plan switcher (multiple plans) ── */}
      {plans.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {plans.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setActivePlanIdx(i); setActiveDay(new Date().getDay()); }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                i === planIndex
                  ? "bg-gym-lime text-gym-black shadow-glow-sm"
                  : "border border-white/10 text-white/60 hover:border-white/25 hover:text-white"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Plan summary card ── */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-surface-2"
        style={{ borderTop: "3px solid #9AD901" }}
      >
        <div className="px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gym-lime/15 text-gym-lime">
                <Icon name="leaf" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-anton text-xl uppercase text-white">{plan.title}</h2>
                {plan.goal && (
                  <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-gym-lime">
                    {plan.goal}
                  </p>
                )}
                {plan.trainer && (
                  <p className="mt-0.5 text-xs text-white/40">by {plan.trainer.name}</p>
                )}
              </div>
            </div>
            {plan.updatedAt && (
              <p className="text-[10px] text-white/30">Updated {timeAgo(plan.updatedAt)}</p>
            )}
          </div>

          {plan.description && (
            <p className="mt-4 text-sm leading-relaxed text-white/60">{plan.description}</p>
          )}
        </div>

        {/* Macro stats — 2×2 grid, fixed zero-value bug with != null */}
        <div className="grid grid-cols-2 gap-px border-t border-white/[0.07] bg-white/[0.07] sm:grid-cols-4">
          {macros.map(({ label, value, unit, color }) => (
            <div key={label} className="flex flex-col items-center bg-surface-2 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{label}</p>
              <p className="mt-2 font-anton text-3xl leading-none" style={{ color }}>
                {value != null ? value : "—"}
              </p>
              {value != null && (
                <p className="mt-0.5 text-[10px] text-white/30">{unit}/day</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Day selector — scrollable pill row ── */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/35">
          Select Day
        </p>
        {/* Overflow-x scroll so all 7 days stay tappable on small phones */}
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
          {DAY_LABELS.map((label, i) => {
            const isToday    = i === todayIndex;
            const isSelected = i === activeDay;
            return (
              <button
                key={label}
                onClick={() => setActiveDay(i)}
                className={`flex shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-center transition active:scale-95 ${
                  isSelected
                    ? "bg-gym-lime text-gym-black shadow-glow-sm"
                    : "border border-white/10 text-white/60 hover:border-gym-lime/30 hover:text-white"
                }`}
                style={{ minWidth: "56px" }}
              >
                <span className="text-xs font-bold uppercase tracking-wide">
                  {DAY_LABELS_SHORT[i]}
                </span>
                {isToday && (
                  <span
                    className={`mt-0.5 text-[9px] font-bold uppercase ${
                      isSelected ? "text-gym-black/70" : "text-gym-lime"
                    }`}
                  >
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-white/35">
          {DAY_LABELS[activeDay]} · {plan.title}
        </p>
      </div>

      {/* ── Meals for selected day ── */}
      {dayMeals.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <span className="text-3xl">🧘</span>
          <div>
            <p className="font-semibold text-white/60">Rest day</p>
            <p className="mt-1 text-xs text-white/30">
              No meals planned for {DAY_LABELS[activeDay]}. Recover well.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {dayMeals.map((meal, mIdx) => {
            const items = parseDietItems(meal.items);
            return (
              <div
                key={meal.id}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-surface-2"
              >
                {/* Meal header */}
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderLeft: "3px solid #9AD901" }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gym-lime/20 font-anton text-xs text-gym-lime">
                        {mIdx + 1}
                      </span>
                      <h3 className="font-bold text-white">{meal.mealName}</h3>
                    </div>
                    {meal.timing && (
                      <p className="mt-0.5 text-xs font-semibold text-gym-lime">{meal.timing}</p>
                    )}
                  </div>
                  {meal.calories != null && (
                    <span className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 font-mono text-sm font-bold text-white/70">
                      {meal.calories} <span className="text-xs text-white/35">kcal</span>
                    </span>
                  )}
                </div>

                {/* Food items */}
                {items.length > 0 && (
                  <ul className="divide-y divide-white/[0.05] px-5">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gym-lime" />
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-white">{item.name}</span>
                            {item.quantity && (
                              <span className="ml-2 text-xs text-white/40">{item.quantity}</span>
                            )}
                          </div>
                        </div>
                        {item.calories != null && (
                          <span className="shrink-0 text-xs text-white/30">
                            {Math.round(item.calories)} kcal
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}