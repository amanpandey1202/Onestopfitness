/**
 * Official fitness-goal presets. Kept in ONE place so registration, the admin
 * member form and the member's own profile all offer identical options —
 * never free-text, so "Weight loss" never becomes "Losing fat" by accident.
 */
export const FITNESS_GOALS: string[] = [
  "Weight loss",
  "Muscle gain",
  "General fitness",
  "Martial arts",
  "Personal training",
  "Endurance / stamina",
];

/**
 * The options for a goal <select>. Legacy rows (created before the presets, or
 * typed free-text) can hold values outside FITNESS_GOALS — surface that value
 * as the first option instead of dropping it, so saving never nukes old data.
 */
export function fitnessGoalOptions(current?: string | null): string[] {
  const options = [...FITNESS_GOALS];
  if (current && !options.includes(current)) {
    options.unshift(current);
  }
  return options;
}

import { z } from "zod";

/**
 * Backend validation for a member's fitness goal: presets are required for new
 * input, but any non-empty legacy free-text value still passes so editing older
 * members never breaks. Empty strings / null are treated as "not set".
 */
export const fitnessGoalField = z
  .union([
    z.enum(FITNESS_GOALS as [string, ...string[]], { message: "Choose a valid goal." }),
    z.string().min(1).max(80),
  ])
  .or(z.literal(""))
  .or(z.null())
  .optional()
  .transform((v) => (v === "" ? null : v));