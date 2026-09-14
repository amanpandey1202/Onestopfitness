// Shared helpers for diet plan day logic (7-day weekly plans).
// dayOfWeek: 0 = Sunday … 6 = Saturday. null = "every day".

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type DietMealLike = {
  id?: string;
  mealName: string;
  timing: string | null;
  items: string;
  calories: number | null;
  dayOfWeek: number | null;
  orderIndex: number;
};

export type DietItem = {
  name: string;
  quantity: string;
  calories?: number | null;
};

/** Parse the JSON `items` column into a typed list, tolerating raw text. */
export function parseDietItems(json: string): DietItem[] {
  try {
    const val = JSON.parse(json);
    if (Array.isArray(val)) {
      return val.map((it) => ({
        name: String(it?.name ?? ""),
        quantity: String(it?.quantity ?? ""),
        calories: it?.calories == null ? null : Number(it.calories),
      }));
    }
    return [{ name: json, quantity: "" }];
  } catch {
    return [{ name: json, quantity: "" }];
  }
}

/** Meals that apply to a given day index (null = every day). Sorted by orderIndex. Internal — use mealsForDayPriority. */
function mealsForDay(meals: DietMealLike[], dayIndex: number): DietMealLike[] {
  return meals
    .filter((m) => m.dayOfWeek === null || m.dayOfWeek === dayIndex)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

/** All meals for a day — with the "every day" meals listed first for readability. */
export function mealsForDayPriority(meals: DietMealLike[], dayIndex: number): DietMealLike[] {
  const all = mealsForDay(meals, dayIndex);
  return [...all.filter((m) => m.dayOfWeek === null), ...all.filter((m) => m.dayOfWeek !== null)];
}

export type DayGroup = { day: number | null; meals: DietMealLike[] };

/** Group meals by their dayOfWeek assignment (null group = every day). */
export function groupMealsByDay(meals: DietMealLike[]): DayGroup[] {
  const map = new Map<number | null, DietMealLike[]>();
  for (const m of [...meals].sort((a, b) => a.orderIndex - b.orderIndex)) {
    const key = m.dayOfWeek ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([day, grouped]) => ({ day, meals: grouped }));
}

/** Human label for a day index or null ("Saturday" / "Every day"). */
export function dayLabel(day: number | null): string {
  return day === null ? "Every day" : DAY_LABELS[day] ?? "Every day";
}