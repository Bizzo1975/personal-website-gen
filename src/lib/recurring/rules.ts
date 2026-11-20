/**
 * W26: validation shared by create and edit of recurring-content rules.
 * Invalid input is refused (400) instead of silently defaulted.
 */
import { query } from '@/lib/db';
import { isValidTimeZone, nextRun, parseTime, validDay, type Pattern } from './schedule';

export const CONTENT_TYPES = ['post', 'project', 'newsletter'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
const TEMPLATE_TABLE: Record<ContentType, string> = { post: 'posts', project: 'projects', newsletter: 'newsletter_campaigns' };

export type RuleValues = {
  name: string; contentType: ContentType; templateContentId: string | null; pattern: Pattern;
  day: number; time: string; timeZone: string; isActive: boolean; nextScheduledAt: Date;
};

type Current = Partial<{
  name: string; content_type: ContentType; template_content_id: string | null; recurrence_pattern: Pattern;
  recurrence_day: number; recurrence_time: string; time_zone: string; is_active: boolean;
}>;

const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** body: the request; current: the stored rule when editing (missing fields keep their values). */
export async function validateRule(body: Record<string, unknown>, current: Current = {}, now = new Date()):
  Promise<{ ok: true; values: RuleValues } | { ok: false; error: string }> {
  const name = has(body, 'name') ? String(body.name ?? '').trim() : (current.name ?? '');
  if (!name || name.length > 255) return { ok: false, error: 'A rule name (up to 255 characters) is required' };

  const contentType = (has(body, 'contentType') ? body.contentType : current.content_type) as ContentType;
  if (!CONTENT_TYPES.includes(contentType)) return { ok: false, error: 'Content type must be post, project or newsletter' };

  const pattern = (has(body, 'recurrencePattern') ? body.recurrencePattern : current.recurrence_pattern) as Pattern;
  if (pattern !== 'weekly' && pattern !== 'monthly') return { ok: false, error: 'Recurrence must be weekly or monthly' };

  // `has`, not `||`: Sunday is day 0.
  const day = Number(has(body, 'recurrenceDay') ? body.recurrenceDay : current.recurrence_day);
  if (!validDay(pattern, day)) {
    return { ok: false, error: pattern === 'weekly' ? 'Day of week must be 0 (Sunday) to 6 (Saturday)' : 'Day of month must be 1 to 31' };
  }

  const rawTime = has(body, 'recurrenceTime') ? body.recurrenceTime : current.recurrence_time;
  const t = parseTime(rawTime);
  if (!t) return { ok: false, error: 'Time must be HH:MM (24-hour)' };
  const time = `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}`;

  const timeZone = String(has(body, 'timeZone') ? body.timeZone : (current.time_zone ?? ''));
  if (!isValidTimeZone(timeZone)) return { ok: false, error: 'A valid time zone (e.g. America/Chicago) is required' };

  let templateContentId: string | null = has(body, 'templateContentId')
    ? (body.templateContentId ? String(body.templateContentId) : null)
    : (current.template_content_id ?? null);
  if (templateContentId) {
    if (!/^[0-9a-f-]{36}$/i.test(templateContentId)) return { ok: false, error: 'Template id is not valid' };
    const found = await query(`SELECT 1 FROM ${TEMPLATE_TABLE[contentType]} WHERE id = $1`, [templateContentId]);
    if (found.rows.length === 0) return { ok: false, error: `The chosen template is not an existing ${contentType}` };
  } else {
    templateContentId = null;
  }

  const isActive = has(body, 'isActive') ? body.isActive !== false : (current.is_active ?? true);
  const nextScheduledAt = nextRun(pattern, day, time, timeZone, now);
  return { ok: true, values: { name, contentType, templateContentId, pattern, day, time, timeZone, isActive, nextScheduledAt } };
}
