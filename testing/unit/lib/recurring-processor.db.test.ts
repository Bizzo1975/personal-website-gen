/**
 * @jest-environment node
 *
 * W26: recurring rules create DRAFTS. Real SQL against a disposable test DB with
 * migrations 20261120-01 and -05. Runs only when WWFL_TEST_DATABASE_URL is set.
 */
const TEST_DB = process.env.WWFL_TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;

import { query, closeDatabase } from '@/lib/db';
import { processDueRecurringRules } from '@/lib/recurring/processor';

const d = TEST_DB ? describe : describe.skip;
const TAG = `jest-rec-${Date.now()}`;
const NOW = new Date('2026-11-23T15:05:00Z'); // Monday 09:05 Chicago

async function makeRule(fields: { type: string; template?: string | null; due?: string; tz?: string; name?: string }) {
  const r = await query(
    `INSERT INTO recurring_content_rules (name, content_type, template_content_id, recurrence_pattern, recurrence_day,
       recurrence_time, time_zone, is_active, next_scheduled_at)
     VALUES ($1, $2, $3, 'weekly', 1, '09:00', $4, true, $5) RETURNING id`,
    [fields.name ?? `${TAG} rule`, fields.type, fields.template ?? null, fields.tz ?? 'America/Chicago', fields.due ?? '2026-11-23T15:00:00Z']
  );
  return r.rows[0].id as string;
}
const rule = async (id: string) => (await query('SELECT * FROM recurring_content_rules WHERE id = $1', [id])).rows[0];

d('recurring processor (DB)', () => {
  let tplPost: string;
  let paused: string[] = [];

  beforeAll(async () => {
    // The processor acts on every due rule: pause rules that are not this test's, restore them after.
    paused = (await query(
      `UPDATE recurring_content_rules SET is_active = false WHERE is_active AND name NOT LIKE $1 RETURNING id`, [`${TAG}%`]
    )).rows.map((r: { id: string }) => r.id);
    tplPost = (await query(
      `INSERT INTO posts (title, slug, content, excerpt, tags, status, published, author, read_time, permission_level)
       VALUES ('Weekly notes', $1, 'Template body', 'Template excerpt', ARRAY['notes'], 'published', true, 'Jon Keck', 3, 'professional')
       RETURNING id`, [`${TAG}-weekly-notes`]
    )).rows[0].id;
  });

  afterAll(async () => {
    await query(`DELETE FROM posts WHERE recurring_rule_id IN (SELECT id FROM recurring_content_rules WHERE name LIKE $1)`, [`${TAG}%`]);
    await query(`DELETE FROM newsletter_campaigns WHERE recurring_rule_id IN (SELECT id FROM recurring_content_rules WHERE name LIKE $1)`, [`${TAG}%`]);
    await query(`DELETE FROM recurring_content_rules WHERE name LIKE $1`, [`${TAG}%`]);
    await query(`DELETE FROM posts WHERE slug LIKE $1`, [`${TAG}%`]);
    if (paused.length) await query(`UPDATE recurring_content_rules SET is_active = true WHERE id = ANY($1::uuid[])`, [paused]);
    await closeDatabase();
  });

  it('creates one unpublished draft copied from the template and moves the rule to next week', async () => {
    const id = await makeRule({ type: 'post', template: tplPost });
    const runs = await processDueRecurringRules(NOW);
    const mine = runs.find((r) => r.ruleId === id)!;
    expect(mine).toMatchObject({ ok: true, nextRunAt: '2026-11-30T15:00:00.000Z' });
    const p = (await query('SELECT * FROM posts WHERE id = $1', [mine.contentId])).rows[0];
    expect(p).toMatchObject({
      title: 'Weekly notes (2026-11-23)', status: 'draft', published: false, content: 'Template body',
      excerpt: 'Template excerpt', author: 'Jon Keck', permission_level: 'professional', recurring_rule_id: id,
    });
    expect(p.slug).toBe(`${TAG}-weekly-notes-2026-11-23`);
    expect(await rule(id)).toMatchObject({ last_error: null, last_created_content_id: mine.contentId });
  });

  it('a second run at the same time creates nothing', async () => {
    const before = (await query(`SELECT COUNT(*)::int n FROM posts WHERE slug LIKE $1`, [`${TAG}%`])).rows[0].n;
    const runs = await processDueRecurringRules(NOW);
    expect(runs.filter((r) => r.ok)).toHaveLength(0);
    expect((await query(`SELECT COUNT(*)::int n FROM posts WHERE slug LIKE $1`, [`${TAG}%`])).rows[0].n).toBe(before);
  });

  it('two overlapping scheduler runs create the draft once', async () => {
    const id = await makeRule({ type: 'post', name: `${TAG} overlap` });
    const [a, b] = await Promise.all([processDueRecurringRules(NOW), processDueRecurringRules(NOW)]);
    const created = [...a, ...b].filter((r) => r.ruleId === id && r.ok);
    expect(created).toHaveLength(1);
    const drafts = (await query('SELECT title, content FROM posts WHERE recurring_rule_id = $1', [id])).rows;
    expect(drafts).toEqual([{ title: `${TAG} overlap (2026-11-23)`, content: '' }]);
  });

  it('a missing template is recorded as a failure, nothing is created, and the rule moves on', async () => {
    const id = await makeRule({ type: 'post', template: '00000000-0000-0000-0000-000000000001', name: `${TAG} missing` });
    const runs = await processDueRecurringRules(NOW);
    expect(runs.find((r) => r.ruleId === id)).toMatchObject({ ok: false, error: 'The template post no longer exists' });
    const r = await rule(id);
    expect(r.last_error).toBe('The template post no longer exists');
    expect(r.next_scheduled_at).toEqual(new Date('2026-11-30T15:00:00Z'));
    expect((await query('SELECT COUNT(*)::int n FROM posts WHERE recurring_rule_id = $1', [id])).rows[0].n).toBe(0);
  });

  it('a newsletter rule creates a draft campaign, never a send', async () => {
    const id = await makeRule({ type: 'newsletter', name: `${TAG} letter` });
    const runs = await processDueRecurringRules(NOW);
    const mine = runs.find((r) => r.ruleId === id)!;
    expect(mine.ok).toBe(true);
    const c = (await query('SELECT status, subject, sent_count FROM newsletter_campaigns WHERE id = $1', [mine.contentId])).rows[0];
    expect(c).toEqual({ status: 'draft', subject: `${TAG} letter`, sent_count: 0 });
  });

  it('deleting a rule keeps the drafts it created', async () => {
    const id = await makeRule({ type: 'post', name: `${TAG} deleted` });
    const mine = (await processDueRecurringRules(NOW)).find((r) => r.ruleId === id)!;
    await query(
      `WITH p AS (UPDATE posts SET recurring_rule_id = NULL WHERE recurring_rule_id = $1),
            j AS (UPDATE projects SET recurring_rule_id = NULL WHERE recurring_rule_id = $1),
            n AS (UPDATE newsletter_campaigns SET recurring_rule_id = NULL WHERE recurring_rule_id = $1)
       DELETE FROM recurring_content_rules WHERE id = $1`, [id]);
    const left = (await query('SELECT recurring_rule_id FROM posts WHERE id = $1', [mine.contentId])).rows;
    expect(left).toEqual([{ recurring_rule_id: null }]);
    await query('DELETE FROM posts WHERE id = $1', [mine.contentId]);
  });
});
