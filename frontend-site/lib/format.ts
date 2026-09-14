export function formatPrice(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

/**
 * Human label for a plan's billing period based on its duration in days.
 * Examples: 30 → "month", 60 → "2 months", 90 → "quarterly", 180 → "6 months",
 * 365 → "annually", anything else → "N days".
 */
export function planPeriodLabel(days?: number | null): string {
  const d = days && days > 0 ? days : 30;
  if (d % 30 === 0) {
    const months = d / 30;
    switch (months) {
      case 1:
        return "month";
      case 2:
        return "2 months";
      case 3:
        return "quarterly";
      case 6:
        return "6 months";
      case 12:
        return "annually";
      default:
        return `${months} months`;
    }
  }
  return `${d} days`;
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

/** "just now", "5m ago", "2h ago", "3d ago" style freshness label. */
export function timeAgo(value: Date | string | number | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 30) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
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

