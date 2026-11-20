/**
 * W31: <input type="datetime-local"> holds the editor's LOCAL wall time with no zone
 * ("2026-11-21T09:00"). The server stores UTC. Always convert at the form boundary.
 */

/** Stored UTC value (ISO string or Date) -> value for a datetime-local input, in the browser's zone. */
export function toDateTimeLocalValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.valueOf())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** datetime-local input value (browser's zone) -> UTC ISO string, or null if empty/invalid. */
export function fromDateTimeLocalValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value); // a zone-less date-time string is parsed as local time
  return Number.isNaN(d.valueOf()) ? null : d.toISOString();
}
