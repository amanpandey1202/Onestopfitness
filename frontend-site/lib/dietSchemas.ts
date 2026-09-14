import { z } from "zod";

/** True when `value` parses to a JSON array. Shared by the API routes. */
export function isJsonArray(value: string): boolean {
  if (!value.trim()) return false;
  try {
    return Array.isArray(JSON.parse(value));
  } catch {
    return false;
  }
}

/**
 * Single source of truth for diet-plan validation, shared by the admin and
 * trainer API routes so create/update payloads behave identically everywhere.
 */
export const dietItemSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.string().optional().nullable(),
  calories: z.number().int().min(0).optional().nullable(),
});

export const dietMealSchema = z.object({
  mealName: z.string().min(1).max(120),
  timing: z.string().optional().nullable(),
  // JSON string array of { name, quantity, calories } — kept as a string to
  // match the DietMeal.items column.
  items: z
    .string()
    .min(1)
    .refine(isJsonArray, "items must be a valid JSON array"),
  calories: z.number().int().min(0).optional().nullable(),
  // 0=Sunday … 6=Saturday; null = every day.
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  orderIndex: z.number().int().default(0),
});

export const dietPlanSchema = z.object({
  memberId: z.string().min(1),
  trainerId: z.string().optional().nullable(),
  title: z.string().min(2).max(120),
  description: z.string().optional().nullable(),
  goal: z.string().optional().nullable(),
  calorieTarget: z.number().int().min(0).optional().nullable(),
  proteinGm: z.number().int().min(0).optional().nullable(),
  carbsGm: z.number().int().min(0).optional().nullable(),
  fatGm: z.number().int().min(0).optional().nullable(),
  meals: z.array(dietMealSchema).default([]),
});

export const DIET_GOALS = ["Fat Loss", "Muscle Gain", "Maintenance", "Athletic Performance"] as const;