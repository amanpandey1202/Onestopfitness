export function formatPrice(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Converts a stored date into a yyyy-mm-dd value for <input type="date">. */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Adds N calendar months to a date preserving the day-of-month.
 * Handles month-end correctly: Jan 31 + 1 month = Feb 28/29 (last day of Feb).
 * This is the correct way to compute membership end dates:
 *   - Feb 15 + 1 month = Mar 15
 *   - Dec 29 + 1 month = Jan 29 (of next year)
 *   - Jan 31 + 1 month = Feb 28 (not March 3)
 *
 * @param date  The start date
 * @param months  Number of calendar months to add (based on plan duration in days
 *                converted: use durationDays / 30 rounded, or pass months directly)
 */
export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = date.getDate();
  result.setMonth(result.getMonth() + months);
  // If setMonth overflowed (e.g. Jan 31 → Mar 3), roll back to last day of target month
  if (result.getDate() !== originalDay) {
    result.setDate(0); // day 0 = last day of previous month
  }
  return result;
}

/**
 * Computes membership end date from a start date and plan duration in days.
 * For plans that are multiples of 30 days, uses calendar-month arithmetic
 * so that a 30-day plan starting Feb 15 ends Mar 15, not Mar 17.
 * For non-round durations (e.g. 45 days), falls back to exact day arithmetic.
 */
export function computeMembershipEndDate(start: Date, durationDays: number): Date {
  // Round multiples of 30 use calendar months
  if (durationDays % 30 === 0) {
    return addCalendarMonths(start, durationDays / 30);
  }
  // Non-round durations (e.g. 15-day trial) use exact days
  return new Date(start.getTime() + durationDays * 86_400_000);
}

