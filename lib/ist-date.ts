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
 * Format timestamp into Indian Standard Time with full weekday name for message cards
 * Example output: "Sunday, 22 Nov 2026, 12:27:02 am IST"
 */
export function formatMessageCardIST(dateVal: Date | string | number): string {
  try {
    const ts = parseDateTimestamp(dateVal);
    if (ts <= 0) return String(dateVal);
    const d = new Date(ts);
    const formatted = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
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
    return String(dateVal);
  }
}

/**
 * Format timestamp into Indian Standard Time with full weekday name for Admin clock
 * Example output: "Saturday, 21 Nov 2026, 03:58:54 pm IST"
 */
export function formatAdminClockIST(date: Date | string | number = new Date()): string {
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    const formatted = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
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

/**
 * Safely parse any date value, ISO string, or IST formatted string into millisecond epoch timestamp.
 * Handles inputs like "21 Nov 2026, 03:11:45 am IST", "31/10/2026, 02:12:00", "10/31/2026, 3:59:00 PM", ISO strings, and Date instances.
 */
export function parseDateTimestamp(val: unknown): number {
  if (!val) return 0;
  if (val instanceof Date) {
    const t = val.getTime();
    return isNaN(t) ? 0 : t;
  }
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return 0;

    // 1. Strip ' IST' suffix if present
    const clean = trimmed.replace(/\s+IST$/i, "").trim();
    const d1 = new Date(clean);
    if (!isNaN(d1.getTime())) return d1.getTime();

    // 2. Strip weekday prefix if present: e.g. "Sunday, 22 Nov 2026, 12:27:02 am"
    const withoutWeekday = clean.replace(/^[A-Za-z]+,\s*/, "").trim();
    const dW = new Date(withoutWeekday);
    if (!isNaN(dW.getTime())) return dW.getTime();

    // 3. Try DD/MM/YYYY or DD-MM-YYYY format: e.g. 31/10/2026, 02:12:00
    const dmyMatch = withoutWeekday.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/);
    if (dmyMatch) {
      const [, day, month, year, rest] = dmyMatch;
      const reordered = `${month}/${day}/${year}${rest}`;
      const d = new Date(reordered);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    // 4. Try raw string as date
    const d2 = new Date(trimmed);
    if (!isNaN(d2.getTime())) return d2.getTime();
  }
  return 0;
}
