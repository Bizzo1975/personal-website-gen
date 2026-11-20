/**
 * W26: turn due recurring-content rules into DRAFTS for review. Nothing is published or
 * sent: a person reviews the draft and publishes or schedules it as usual.
 *
 * - Each due rule is locked (FOR UPDATE SKIP LOCKED), so overlapping scheduler runs
 *   cannot create the same draft twice.
 * - One draft per run, even if several runs were missed while the server was down;
 *   the next run is computed from now.
 * - The outcome is recorded on the rule: last_created_content_id, or last_error.
 */
import type { PoolClient } from 'pg';
import { getClient } from '@/lib/db';
import { nextRun, type Pattern } from './schedule';

export type RuleRunResult = { ruleId: string; ok: boolean; contentId?: string; error?: string; nextRunAt?: string };

type Rule = {
  id: string; name: string; content_type: 'post' | 'project' | 'newsletter'; template_content_id: string | null;
  recurrence_pattern: Pattern; recurrence_day: number; recurrence_time: string; time_zone: string; created_by: string | null;
};

/** YYYY-MM-DD for `at` in the rule's zone, used in titles and slugs of created drafts. */
export function localDateLabel(at: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}

function slugBase(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 180) || 'recurring';
}

async function uniqueSlug(c: PoolClient, table: 'posts' | 'projects' | 'newsletter_campaigns', base: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const r = await c.query(`SELECT 1 FROM ${table} WHERE slug = $1`, [slug]);
    if (r.rows.length === 0) return slug;
  }
  throw new Error('Could not find a free slug');
}

async function createDraft(c: PoolClient, rule: Rule, label: string): Promise<string> {
  const tpl = rule.template_content_id;
  if (rule.content_type === 'post') {
    const t = tpl ? (await c.query('SELECT * FROM posts WHERE id = $1', [tpl])).rows[0] : null;
    if (tpl && !t) throw new Error('The template post no longer exists');
    const title = `${t ? t.title : rule.name} (${label})`;
    const slug = await uniqueSlug(c, 'posts', `${slugBase(t ? t.slug : rule.name)}-${label}`);
    const r = await c.query(
      `INSERT INTO posts (title, slug, content, excerpt, tags, featured_image, author, read_time, date,
                          permission_level, status, published, recurring_rule_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9, 'draft', false, $10, $11) RETURNING id`,
      [title, slug, t?.content ?? '', t?.excerpt ?? null, t?.tags ?? null, t?.featured_image ?? null,
       t?.author ?? null, t?.read_time ?? null, t?.permission_level ?? 'all', rule.id, rule.created_by]
    );
    return r.rows[0].id;
  }
  if (rule.content_type === 'project') {
    const t = tpl ? (await c.query('SELECT * FROM projects WHERE id = $1', [tpl])).rows[0] : null;
    if (tpl && !t) throw new Error('The template project no longer exists');
    const title = `${t ? t.title : rule.name} (${label})`;
    const slug = await uniqueSlug(c, 'projects', `${slugBase(t ? t.slug : rule.name)}-${label}`);
    const r = await c.query(
      `INSERT INTO projects (title, slug, description, content, image, technologies, live_demo, source_code,
                             permission_level, status, recurring_rule_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, $11) RETURNING id`,
      [title, slug, t?.description ?? '', t?.content ?? null, t?.image ?? null, t?.technologies ?? [],
       t?.live_demo ?? null, t?.source_code ?? null, t?.permission_level ?? 'all', rule.id, rule.created_by]
    );
    return r.rows[0].id;
  }
  const t = tpl ? (await c.query('SELECT * FROM newsletter_campaigns WHERE id = $1', [tpl])).rows[0] : null;
  if (tpl && !t) throw new Error('The template campaign no longer exists');
  const title = `${t ? t.title : rule.name} (${label})`;
  const slug = await uniqueSlug(c, 'newsletter_campaigns', `${slugBase(t ? t.slug : rule.name)}-${label}`);
  const r = await c.query(
    `INSERT INTO newsletter_campaigns (title, slug, subject, preview_text, content, html_content, plain_text_content,
                                       template_id, type, status, recurring_rule_id, created_by, author)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, $11, 'recurring rule') RETURNING id`,
    [title.slice(0, 255), slug, t?.subject ?? rule.name, t?.preview_text ?? null, t?.content ?? '', t?.html_content ?? null,
     t?.plain_text_content ?? null, t?.template_id ?? null, t?.type ?? 'manual', rule.id, rule.created_by]
  );
  return r.rows[0].id;
}

/** Run one locked rule inside its own transaction. */
async function runRule(c: PoolClient, rule: Rule, now: Date): Promise<RuleRunResult> {
  let next: Date;
  try {
    next = nextRun(rule.recurrence_pattern, rule.recurrence_day, String(rule.recurrence_time), rule.time_zone, now);
  } catch (e) {
    // Bad settings: stop the rule rather than retry every five minutes.
    const error = `Invalid schedule settings (${e instanceof Error ? e.message : String(e)}); rule paused`;
    await c.query(`UPDATE recurring_content_rules SET is_active = false, last_run_at = $2, last_error = $3 WHERE id = $1`, [rule.id, now, error]);
    return { ruleId: rule.id, ok: false, error };
  }
  await c.query('SAVEPOINT create_draft');
  try {
    const contentId = await createDraft(c, rule, localDateLabel(now, rule.time_zone));
    await c.query(
      `UPDATE recurring_content_rules
          SET next_scheduled_at = $2, last_run_at = $3, last_created_at = $3, last_error = NULL, last_created_content_id = $4
        WHERE id = $1`,
      [rule.id, next, now, contentId]
    );
    return { ruleId: rule.id, ok: true, contentId, nextRunAt: next.toISOString() };
  } catch (e) {
    await c.query('ROLLBACK TO SAVEPOINT create_draft');
    const error = e instanceof Error ? e.message : String(e);
    // The run is recorded as failed and the rule moves to its next run (no retry storm).
    await c.query(
      `UPDATE recurring_content_rules SET next_scheduled_at = $2, last_run_at = $3, last_error = $4 WHERE id = $1`,
      [rule.id, next, now, error]
    );
    return { ruleId: rule.id, ok: false, error, nextRunAt: next.toISOString() };
  }
}

export async function processDueRecurringRules(now: Date = new Date()): Promise<RuleRunResult[]> {
  const results: RuleRunResult[] = [];
  // One rule per transaction, so one failure cannot undo another rule's draft.
  for (let i = 0; i < 100; i++) {
    const c = await getClient();
    try {
      await c.query('BEGIN');
      const due = await c.query(
        `SELECT id, name, content_type, template_content_id, recurrence_pattern, recurrence_day,
                to_char(recurrence_time, 'HH24:MI') AS recurrence_time, time_zone, created_by
           FROM recurring_content_rules
          WHERE is_active = true AND next_scheduled_at IS NOT NULL AND next_scheduled_at <= $1
          ORDER BY next_scheduled_at
          LIMIT 1
          FOR UPDATE SKIP LOCKED`,
        [now]
      );
      if (due.rows.length === 0) { await c.query('COMMIT'); break; }
      results.push(await runRule(c, due.rows[0], now));
      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK').catch(() => undefined);
      throw e;
    } finally {
      c.release();
    }
  }
  return results;
}
