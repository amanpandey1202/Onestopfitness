"use client";

import { memo, useMemo, useState } from "react";
import { Button, Field, Input, Select, TextArea, Spinner } from "@/components/admin/ui";
import { DAY_LABELS, DAY_LABELS_SHORT, dayLabel, parseDietItems, type DietItem } from "@/lib/diet";
import { DIET_GOALS } from "@/lib/dietSchemas";
import { FOOD_SUGGESTIONS, suggestFoods, type FoodSuggestion } from "@/lib/foodSuggestions";

export type DietEditorMember = {
  id: string;
  name: string;
  memberCode?: string | null;
  phone?: string | null;
};

export type DietEditorTrainer = { id: string; name: string };

export type DietEditorCopyPlan = {
  id: string;
  title: string;
  meals: {
    mealName: string;
    timing: string | null;
    calories: number | null;
    items: string;
    dayOfWeek: number | null;
  }[];
};

export type DietPlanEditorProps = {
  members: DietEditorMember[];
  trainers?: DietEditorTrainer[];
  copyPlans?: DietEditorCopyPlan[];
  /** Only used on the admin "create" path — lets one plan structure be
   * assigned to many members at once (one DietPlan row per member). */
  bulk?: boolean;
  initial?: {
    id?: string;
    memberId?: string;
    trainerId?: string | null;
    title?: string;
    goal?: string | null;
    description?: string | null;
    calorieTarget?: number | null;
    proteinGm?: number | null;
    carbsGm?: number | null;
    fatGm?: number | null;
    meals?: {
      mealName: string;
      timing: string | null;
      calories: number | null;
      items: string;
      dayOfWeek: number | null;
    }[];
  } | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

type ItemDraft = { name: string; quantity: string; calories: string };
type MealDraft = {
  mealName: string;
  timing: string;
  calories: string;
  dayOfWeek: number | null;
  items: ItemDraft[];
};

function emptyItem(): ItemDraft {
  return { name: "", quantity: "", calories: "" };
}

/** Filter-the-ground-as-you-type row of food suggestions, memoized per name. */
const ItemFoodSuggestions = memo(function ItemFoodSuggestions({
  name,
  onPick,
}: {
  name: string;
  onPick: (f: FoodSuggestion) => void;
}) {
  const matches = useMemo(() => suggestFoods(name), [name]);
  if (matches.length === 0 || !name.trim()) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {matches.map((f) => (
        <button
          key={f.name}
          type="button"
          onClick={() => onPick(f)}
          className="rounded-full border border-gym-lime/30 px-2.5 py-0.5 text-[10px] text-gym-lime transition hover:bg-gym-lime/10"
        >
          {f.name} · {f.quantity}
        </button>
      ))}
    </div>
  );
});

function emptyMeal(dayOfWeek: number | null): MealDraft {
  return { mealName: "", timing: "", calories: "", dayOfWeek, items: [emptyItem()] };
}

function toNum(v: string): number | null {
  const n = Number(v);
  return v.trim() === "" || !Number.isFinite(n) ? null : Math.max(0, n);
}

function itemDraftFrom(item: DietItem): ItemDraft {
  return {
    name: item.name,
    quantity: item.quantity ?? "",
    calories: item.calories == null ? "" : String(item.calories),
  };
}

export default function DietPlanEditor({
  members,
  trainers,
  copyPlans,
  bulk = false,
  initial,
  onSave,
  onCancel,
  submitLabel = "Save Diet Plan",
}: DietPlanEditorProps) {
  const isBulkCreate = bulk && !initial?.id;
  const [memberId, setMemberId] = useState(initial?.memberId ?? "");
  const [bulkMemberIds, setBulkMemberIds] = useState<string[]>(initial?.id ? [] : initial?.memberId ? [initial.memberId] : []);
  const [memberSearch, setMemberSearch] = useState("");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? DIET_GOALS[0]);
  const [calorieTarget, setCalorieTarget] = useState(initial?.calorieTarget?.toString() ?? "");
  const [proteinGm, setProteinGm] = useState(initial?.proteinGm?.toString() ?? "");
  const [carbsGm, setCarbsGm] = useState(initial?.carbsGm?.toString() ?? "");
  const [fatGm, setFatGm] = useState(initial?.fatGm?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [trainerId, setTrainerId] = useState(initial?.trainerId ?? "");
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [meals, setMeals] = useState<MealDraft[]>(
    initial?.meals?.map((m) => ({
      mealName: m.mealName,
      timing: m.timing ?? "",
      calories: m.calories?.toString() ?? "",
      dayOfWeek: m.dayOfWeek ?? null,
      items: parseDietItems(m.items).map(itemDraftFrom),
    })) ?? [emptyMeal(null)]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members.slice(0, 24);
    return members
      .filter((m) => {
        const hay = `${m.name} ${m.memberCode ?? ""} ${m.phone ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 24);
  }, [members, memberSearch]);

  const tabMeals = meals.filter((m) => m.dayOfWeek === activeDay);
  const selectedMember = members.find((m) => m.id === memberId);

  function setMealField(idx: number, field: keyof MealDraft, value: string | ItemDraft[]) {
    setMeals((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  function setItemField(mealIdx: number, itemIdx: number, field: keyof ItemDraft, value: string) {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIdx
          ? { ...m, items: m.items.map((it, j) => (j === itemIdx ? { ...it, [field]: value } : it)) }
          : m
      )
    );
  }

  function addMeal() {
    setMeals((prev) => [...prev, emptyMeal(activeDay)]);
  }

  function removeMeal(idx: number) {
    setMeals((prev) => prev.filter((_, i) => i !== idx));
  }

  function addItem(mealIdx: number) {
    setMeals((prev) => prev.map((m, i) => (i === mealIdx ? { ...m, items: [...m.items, emptyItem()] } : m)));
  }

  function removeItem(mealIdx: number, itemIdx: number) {
    setMeals((prev) =>
      prev.map((m, i) => (i === mealIdx ? { ...m, items: m.items.filter((_, j) => j !== itemIdx) } : m))
    );
  }

  function appendFood(mealIdx: number, name: string, quantity: string, calories: number) {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIdx
          ? { ...m, items: [...m.items, { name, quantity, calories: calories ? String(calories) : "" }] }
          : m
      )
    );
  }

  function applySuggestion(mealIdx: number, itemIdx: number, name: string, quantity: string, calories: number) {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIdx
          ? {
              ...m,
              items: m.items.map((it, j) =>
                j === itemIdx
                  ? {
                      name,
                      quantity,
                      calories: it.calories.trim() ? it.calories : calories ? String(calories) : it.calories,
                    }
                  : it
              ),
            }
          : m
      )
    );
  }

  function loadCopyPlan(id: string) {
    const plan = copyPlans?.find((p) => p.id === id);
    if (!plan) return;
    const hasUnsavedMeals = meals.some((m) => m.mealName.trim() || m.items.some((it) => it.name.trim()));
    if (hasUnsavedMeals && !confirm("Copying will replace all current meals. Continue?")) return;
    setMeals(
      plan.meals.map((m) => ({
        mealName: m.mealName,
        timing: m.timing ?? "",
        calories: m.calories?.toString() ?? "",
        dayOfWeek: m.dayOfWeek ?? null,
        items: parseDietItems(m.items).map(itemDraftFrom),
      }))
    );
    setActiveDay(null);
    setError("");
  }

  function validate(): string {
    if (isBulkCreate) {
      if (bulkMemberIds.length === 0) return "Select at least one member.";
    } else {
      if (!memberId) return "Select a member.";
    }
    if (title.trim().length < 2) return "Plan title is required.";
    const validMeals = meals.filter((m) => m.mealName.trim() && m.items.some((it) => it.name.trim()));
    if (validMeals.length === 0) return "Add at least one meal with a name and one food item.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) return;

    const validMeals = meals.filter((m) => m.mealName.trim() && m.items.some((it) => it.name.trim()));
    const payload: Record<string, unknown> = isBulkCreate
      ? { memberIds: bulkMemberIds }
      : { memberId };
    Object.assign(payload, {
      title: title.trim(),
      goal: goal.trim() || null,
      description: description.trim() || null,
      calorieTarget: toNum(calorieTarget),
      proteinGm: toNum(proteinGm),
      carbsGm: toNum(carbsGm),
      fatGm: toNum(fatGm),
      meals: validMeals.map((m) => ({
        mealName: m.mealName.trim(),
        timing: m.timing.trim() || null,
        calories: toNum(m.calories),
        dayOfWeek: m.dayOfWeek,
        items: JSON.stringify(
          m.items
            .filter((it) => it.name.trim())
            .map((it) => ({
              name: it.name.trim(),
              quantity: it.quantity.trim(),
              calories: toNum(it.calories),
            }))
        ),
      })),
    });
    // Only the admin editor can reassign ownership.
    if (trainers) payload.trainerId = trainerId || null;

    setBusy(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save diet plan.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Member search picker */}
      <Field label={isBulkCreate ? `Assign Members (${bulkMemberIds.length} selected)` : "Assign Member"}>
        {isBulkCreate ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {bulkMemberIds.map((id) => {
                const m = members.find((x) => x.id === id);
                if (!m) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gym-lime/40 bg-gym-lime/10 px-2.5 py-1 text-[11px] font-bold text-gym-lime"
                  >
                    {m.name}
                    <button
                      type="button"
                      onClick={() => setBulkMemberIds((prev) => prev.filter((x) => x !== id))}
                      className="text-gym-lime/60 hover:text-white"
                      aria-label={`Remove ${m.name}`}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
              {bulkMemberIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBulkMemberIds([])}
                  className="text-[11px] font-semibold text-white/40 underline-offset-2 hover:text-white hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name, code or phone…"
            />
            <div className="max-h-44 space-y-1 overflow-y-auto">
              {filteredMembers.map((m) => {
                const selected = bulkMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setBulkMemberIds((prev) => (selected ? prev.filter((x) => x !== m.id) : [...prev, m.id]))
                    }
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm text-white transition ${
                      selected
                        ? "border-gym-lime/60 bg-gym-lime/10"
                        : "border-white/10 bg-surface-3 hover:border-gym-lime/50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                          selected ? "border-gym-lime bg-gym-lime text-black" : "border-white/30"
                        }`}
                      >
                        {selected ? "✓" : ""}
                      </span>
                      {m.name}
                    </span>
                    <span className="font-mono text-xs text-white/35">{m.memberCode ?? ""}</span>
                  </button>
                );
              })}
              {filteredMembers.length === 0 && (
                <p className="px-1 py-2 text-xs text-white/40">No members match “{memberSearch}”.</p>
              )}
            </div>
            <p className="text-[11px] text-white/40">
              Tip: one plan is created per selected member, so all of them get the same meals.
            </p>
          </div>
        ) : selectedMember ? (
          <div className="flex items-center justify-between rounded-lg border border-gym-lime/40 bg-gym-lime/5 px-3 py-2">
            <span className="text-sm font-bold text-white">
              {selectedMember.name}
              {selectedMember.memberCode ? (
                <span className="ml-2 font-mono text-xs text-white/40">#{selectedMember.memberCode}</span>
              ) : null}
            </span>
            <button type="button" onClick={() => setMemberId("")} className="text-xs text-white/50 hover:text-white">
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name, code or phone…"
            />
            <div className="max-h-44 space-y-1 overflow-y-auto">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMemberId(m.id);
                    setMemberSearch("");
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-surface-3 px-3 py-2 text-left text-sm text-white transition hover:border-gym-lime/50"
                >
                  <span>{m.name}</span>
                  <span className="font-mono text-xs text-white/35">{m.memberCode ?? ""}</span>
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <p className="px-1 py-2 text-xs text-white/40">No members match “{memberSearch}”.</p>
              )}
            </div>
          </div>
        )}
      </Field>

      {trainers && (
        <Field label="Assign Trainer (optional)">
          <Select value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
            <option value="">No trainer</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Plan Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2000 kcal Fat Loss Plan" required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fitness Goal">
          <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="">No goal</option>
            {DIET_GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Calorie Target">
          <Input type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} placeholder="2000" />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Protein (g)">
          <Input type="number" value={proteinGm} onChange={(e) => setProteinGm(e.target.value)} placeholder="150" />
        </Field>
        <Field label="Carbs (g)">
          <Input type="number" value={carbsGm} onChange={(e) => setCarbsGm(e.target.value)} placeholder="200" />
        </Field>
        <Field label="Fat (g)">
          <Input type="number" value={fatGm} onChange={(e) => setFatGm(e.target.value)} placeholder="65" />
        </Field>
      </div>

      <Field label="Notes / Guidelines">
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Drink 4L water daily, avoid sugar…"
          rows={2}
        />
      </Field>

      {copyPlans && copyPlans.length > 0 && (
        <Field label="Copy meals from one of your existing plans" hint="Replaces the current meal grid below.">
          <Select
            value=""
            onChange={(e) => {
              if (e.target.value) loadCopyPlan(e.target.value);
            }}
          >
            <option value="">Choose a plan to copy…</option>
            {copyPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {/* Day tabs */}
      <div>
        <p className="label-kicker mb-1.5">Day</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveDay(null)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeDay === null ? "bg-primary text-primary-foreground" : "border border-white/10 text-white/65 hover:border-white/25"
            }`}
          >
            Every day
          </button>
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveDay(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeDay === i ? "bg-primary text-primary-foreground" : "border border-white/10 text-white/65 hover:border-white/25"
              }`}
            >
              {DAY_LABELS_SHORT[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Meals for the active day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">
            Meals — {dayLabel(activeDay)}
          </p>
          <Button type="button" variant="secondary" className="px-3 py-1 text-[10px]" onClick={addMeal}>
            + Add Meal
          </Button>
        </div>

        {tabMeals.length === 0 && (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-xs text-white/40">
            No meals planned for this day yet.
          </p>
        )}

        {tabMeals.map((meal, ti) => {
          const mealIdx = meals.indexOf(meal);
          return (
            <div key={mealIdx} className="rounded-lg border border-white/10 bg-gym-black/60 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={meal.mealName}
                  onChange={(e) => setMealField(mealIdx, "mealName", e.target.value)}
                  placeholder={`Meal ${ti + 1} (e.g. Breakfast)`}
                  className="flex-1"
                />
                <Input
                  value={meal.timing}
                  onChange={(e) => setMealField(mealIdx, "timing", e.target.value)}
                  placeholder="Time"
                  className="w-28"
                />
                <Input
                  type="number"
                  value={meal.calories}
                  onChange={(e) => setMealField(mealIdx, "calories", e.target.value)}
                  placeholder="kcal"
                  className="w-20"
                />
                {meals.length > 1 && (
                  <Button type="button" variant="ghost" className="px-2 py-0.5 text-[10px]" onClick={() => removeMeal(mealIdx)}>
                    ✕
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                {meal.items.map((item, ii) => {
                  return (
                    <div key={ii}>
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) => setItemField(mealIdx, ii, "name", e.target.value)}
                          placeholder="Food item (e.g. Oats with Milk)"
                          className="flex-1"
                        />
                        <Input
                          value={item.quantity}
                          onChange={(e) => setItemField(mealIdx, ii, "quantity", e.target.value)}
                          placeholder="Qty (60g)"
                          className="w-28"
                        />
                        <Input
                          type="number"
                          value={item.calories}
                          onChange={(e) => setItemField(mealIdx, ii, "calories", e.target.value)}
                          placeholder="kcal"
                          className="w-20"
                        />
                        <Button type="button" variant="ghost" className="px-2 py-0.5 text-[10px]" onClick={() => removeItem(mealIdx, ii)}>
                          ✕
                        </Button>
                      </div>
                      <ItemFoodSuggestions
                        name={item.name}
                        onPick={(f) => applySuggestion(mealIdx, ii, f.name, f.quantity, f.calories)}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" className="px-2.5 py-0.5 text-[10px]" onClick={() => addItem(mealIdx)}>
                  + Item
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2.5 py-0.5 text-[10px]"
                  onClick={() => setShowQuickAdd(showQuickAdd === String(mealIdx) ? null : String(mealIdx))}
                >
                  {showQuickAdd === String(mealIdx) ? "Hide suggestions" : "Quick add from list"}
                </Button>
              </div>

              {showQuickAdd === String(mealIdx) && (
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-surface-3 p-2.5">
                  {FOOD_SUGGESTIONS.map((cat) => (
                    <div key={cat.label}>
                      <p className="px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">{cat.label}</p>
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {cat.foods.map((f) => (
                          <button
                            key={f.name}
                            type="button"
                            onClick={() => appendFood(mealIdx, f.name, f.quantity, f.calories)}
                            className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] text-white/80 transition hover:border-gym-lime/50 hover:text-gym-lime"
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}