/**
 * @jest-environment node
 *
 * W8/W34: the post status rule, run as real SQL against a disposable test DB.
 * Runs only when WWFL_TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DB = process.env.WWFL_TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;

import { query, closeDatabase } from '@/lib/db';
import { postStatusAssignments, parsePostStatus } from '@/lib/post-status';

const d = TEST_DB ? describe : describe.skip;
const TAG = `jest-post-${Date.now()}`;

async function makePost(fields: { status: string; published: boolean; scheduled?: string | null; publishedAt?: string | null }) {
  const r = await query(
    `INSERT INTO posts (title, slug, content, status, published, scheduled_publish_at, published_at)
     VALUES ('T', $1, 'C', $2, $3, $4, $5) RETURNING id`,
    [`${TAG}-${Math.random().toString(36).slice(2)}`, fields.status, fields.published, fields.scheduled ?? null, fields.publishedAt ?? null]
  );
  return r.rows[0].id as string;
}
async function apply(id: string, status: string | null) {
  const r = await query(
    `UPDATE posts SET ${postStatusAssignments('$1')} WHERE id = $2
     RETURNING status, published, scheduled_publish_at, published_at`,
    [status, id]
  );
  return r.rows[0];
}

describe('parsePostStatus', () => {
  it('accepts the three statuses, null for none, false for anything else', () => {
    expect(parsePostStatus('draft')).toBe('draft');
    expect(parsePostStatus(undefined)).toBeNull();
    expect(parsePostStatus('')).toBeNull();
    expect(parsePostStatus('archived')).toBe(false);
  });
});

d('post status rule (DB)', () => {
  afterAll(async () => {
    await query(`DELETE FROM posts WHERE slug LIKE $1`, [`${TAG}-%`]);
    await closeDatabase();
  });

  it('draft clears the schedule (the paused-campaign case)', async () => {
    const id = await makePost({ status: 'draft', published: false, scheduled: '2026-11-30T22:30:00Z' });
    expect(await apply(id, 'draft')).toMatchObject({ status: 'draft', published: false, scheduled_publish_at: null });
  });

  it('reverting a published post to draft makes it no longer public (W34)', async () => {
    const id = await makePost({ status: 'published', published: true, publishedAt: '2026-11-01T12:00:00Z' });
    const r = await apply(id, 'draft');
    expect(r).toMatchObject({ status: 'draft', published: false });
    // the public blog query: published = true OR status = 'published'
    const visible = (await query(`SELECT 1 FROM posts WHERE id = $1 AND (published = true OR status = 'published')`, [id])).rows.length;
    expect(visible).toBe(0);
  });

  it('publishing sets published and published_at, keeps an existing published_at and the schedule', async () => {
    const id = await makePost({ status: 'scheduled', published: false, scheduled: '2026-12-01T15:00:00Z' });
    const r = await apply(id, 'published');
    expect(r.published).toBe(true);
    expect(r.published_at).not.toBeNull();
    expect(r.scheduled_publish_at).toEqual(new Date('2026-12-01T15:00:00Z'));
    const again = await apply(id, 'published');
    expect(again.published_at).toEqual(r.published_at);
  });

  it('no status change leaves everything as it was', async () => {
    const id = await makePost({ status: 'scheduled', published: false, scheduled: '2026-12-02T15:00:00Z' });
    expect(await apply(id, null)).toMatchObject({ status: 'scheduled', published: false, scheduled_publish_at: new Date('2026-12-02T15:00:00Z') });
  });
});
