/**
 * Helpers for class scheduling and next-occurrence calculation.
 * Avoids the "always books for today" bug.
 */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Returns the next upcoming dates for a given day-of-week,
 * starting from `from` (or the next matching day-of-week if `from` matches).
 * `count` controls how many future dates to return (default 2).
 */
export function nextClassDates(dayOfWeek: number, from: Date, count = 2): Date[] {
  const dates: Date[] = [];
  // Clone `from` to avoid mutation
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  // Find the first matching day that is strictly after today
  while (dates.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === dayOfWeek) {
      dates.push(new Date(cursor));
    }
  }
  return dates;
}

/**
 * Returns the next single occurrence for a day-of-week after a reference date.
 * Useful as the default selected date when no date picker is shown.
 */
export function nextOccurrence(dayOfWeek: number, from: Date): Date {
  const dates = nextClassDates(dayOfWeek, from, 1);
  return dates[0] ?? new Date();
}

/**
 * Formats a Date as a local YYYY-MM-DD string (for comparisons / API payloads)
 * without the UTC-shift risk of .toISOString().
 */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Formats a Date as "Mon 8 Sep" for display in the booking UI.
 */
export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function dayName(dayOfWeek: number): string {
  return DAYS[dayOfWeek] ?? "";
}

export { DAYS };
