import { Role } from "@prisma/client";
import { HttpError } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { isJsonArray } from "@/lib/dietSchemas";

/** tri-state: undefined → no change, null/"" → clear, number → set */
export const numTri = (v: unknown): number | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : null;
};

/** tri-state for optional strings: undefined → no change, null → clear */
export const strTri = (v: unknown): string | null | undefined =>
  v === undefined ? undefined : v === null ? null : String(v);

/** Normalize + re-index meals; returns null when the field isn't a list. */
export function saneMeals(meals: unknown) {
  if (!Array.isArray(meals)) return null;
  const validDays = new Set([0, 1, 2, 3, 4, 5, 6]);
  return meals
    .map((raw) => {
      const m = raw as Record<string, unknown>;
      const d = Number(m.dayOfWeek);
      const items = typeof m.items === "string" ? m.items : JSON.stringify(m.items ?? []);
      return {
        mealName: String(m.mealName ?? "Meal").slice(0, 120),
        timing: m.timing ? String(m.timing).slice(0, 30) : null,
        // Only store valid JSON arrays; garbage falls back to a single entry so
        // parseDietItems() still round-trips cleanly.
        items: isJsonArray(items) ? items : JSON.stringify([{ name: String(m.items), quantity: "" }]),
        calories: Number.isFinite(Number(m.calories)) ? Math.max(0, Number(m.calories)) : null,
        dayOfWeek:
          m.dayOfWeek == null || m.dayOfWeek === "" || !Number.isFinite(d)
            ? null
            : validDays.has(d)
              ? d
              : null,
        orderIndex: Number.isFinite(Number(m.orderIndex)) ? Number(m.orderIndex) : 0,
      };
    })
    .map((m, i) => ({ ...m, orderIndex: i })); // re-index so order always matches the UI
}

/** Throws 404 unless the id points at a real MEMBER account. */
export async function requireValidMemberId(memberId: unknown): Promise<string> {
  if (typeof memberId !== "string" || memberId.length === 0) {
    throw new HttpError(404, "Member not found");
  }
  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== Role.MEMBER) {
    throw new HttpError(404, "Member not found");
  }
  return member.id;
}

/** Throws 404 unless the id points at a real, active TRAINER account (or is unset). */
export async function requireActiveTrainerId(trainerId: unknown): Promise<string | null> {
  if (trainerId === undefined || trainerId === null || trainerId === "") return null;
  if (typeof trainerId !== "string") throw new HttpError(404, "Trainer not found");
  const trainer = await prisma.user.findUnique({ where: { id: trainerId } });
  if (!trainer || trainer.role !== Role.TRAINER || trainer.isActive === false) {
    throw new HttpError(404, "Trainer not found");
  }
  return trainer.id;
}