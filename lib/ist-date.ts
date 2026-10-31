/**
 * Format any timestamp into Indian Standard Time (IST, UTC+05:30)
 * Example output: "30 Oct 2026, 06:45:10 PM IST"
 */
export function formatIndianTime(date: Date | string | number): string {
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    const formatted = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
    return `${formatted} IST`;
  } catch {
    return String(date);
  }
}

/**
 * Format date in Indian style: "30 Oct 2026"
 */
export function formatIndianDate(date: Date | string | number): string {
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return String(date);
  }
}
