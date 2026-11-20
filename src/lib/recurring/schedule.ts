/**
 * W26: when a recurring rule next runs. Times are wall-clock times in the rule's IANA
 * time zone (e.g. "09:00" in America/Chicago), not in the server's zone (live runs UTC).
 */

export type Pattern = 'weekly' | 'monthly';

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

export function parseTime(time: unknown): { h: number; m: number } | null {
  const match = typeof time === 'string' ? /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time) : null;
  if (!match) return null;
  const h = Number(match[1]); const m = Number(match[2]);
  return h <= 23 && m <= 59 ? { h, m } : null;
}

export function validDay(pattern: Pattern, day: unknown): day is number {
  return Number.isInteger(day) && (pattern === 'weekly' ? (day as number) >= 0 && (day as number) <= 6 : (day as number) >= 1 && (day as number) <= 31);
}

/** Wall-clock parts of an instant in a time zone. */
function partsIn(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  });
  const p: Record<string, string> = {};
  for (const { type, value } of f.formatToParts(date)) p[type] = value;
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute };
}

/** The UTC instant at which the wall clock in `tz` reads y-mo-d h:mi. */
export function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const wanted = Date.UTC(y, mo - 1, d, h, mi);
  let guess = wanted;
  for (let i = 0; i < 3; i++) {
    const p = partsIn(new Date(guess), tz);
    const seen = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi);
    if (seen === wanted) break;
    guess += wanted - seen;
  }
  // In a spring-forward gap the wall time does not exist; the result is the nearest valid time.
  return new Date(guess);
}

function daysInMonth(y: number, mo: number) { return new Date(Date.UTC(y, mo, 0)).getUTCDate(); }

/**
 * First run strictly after `after`. Monthly days past the end of a month use its last day
 * (31 in February runs on the 28th/29th) instead of rolling into the next month.
 */
export function nextRun(pattern: Pattern, day: number, time: string, tz: string, after: Date): Date {
  const t = parseTime(time);
  if (!t || !validDay(pattern, day) || !isValidTimeZone(tz)) throw new Error('Invalid recurrence settings');
  const now = partsIn(after, tz);
  if (pattern === 'weekly') {
    for (let i = 0; i <= 7; i++) {
      const base = new Date(Date.UTC(now.y, now.mo - 1, now.d + i));
      if (base.getUTCDay() !== day) continue;
      const at = zonedToUtc(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), t.h, t.m, tz);
      if (at > after) return at;
    }
  } else {
    for (let i = 0; i <= 2; i++) {
      const first = new Date(Date.UTC(now.y, now.mo - 1 + i, 1));
      const y = first.getUTCFullYear(); const mo = first.getUTCMonth() + 1;
      const at = zonedToUtc(y, mo, Math.min(day, daysInMonth(y, mo)), t.h, t.m, tz);
      if (at > after) return at;
    }
  }
  throw new Error('Could not compute the next run');
}
