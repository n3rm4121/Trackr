// Date and text helpers shared by the board, drawer and stats page.

const DAY_MS = 86_400_000;

// Whole days between `date` and now, always positive.
export function daysSince(date: string | Date, now = new Date()): number {
  const then = typeof date === "string" ? new Date(date) : date;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / DAY_MS));
}

// "today", "yesterday", "5d ago", "3w ago" — compact, for card footers.
export function relativeDays(date: string | Date, now = new Date()): string {
  const days = daysSince(date, now);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 35) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// A short absolute date for detail rows: "12 Aug 2026".
export function shortDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Timestamp for note rows: "12 Aug, 14:05".
export function noteTimestamp(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return `${value.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${value.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// YYYY-MM-DD in local time, the format an <input type="date"> speaks.
export function toDateInputValue(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}
