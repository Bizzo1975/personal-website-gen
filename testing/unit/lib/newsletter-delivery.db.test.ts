/**
 * @jest-environment node
 *
 * Integration test for real newsletter delivery (W14-W18) against a disposable
 * Postgres that has the live schema plus migrations 20261120-01..03.
 * Runs only when WWFL_TEST_DATABASE_URL is set; never point it at production.
 * No email is sent: the Graph sender is injected.
 */
const TEST_DB = process.env.WWFL_TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;
process.env.NEXTAUTH_URL = 'https://willworkforlunch.test';

// 'marked' ships ESM only, which this Jest setup cannot load; markdown rendering is not under test here.
jest.mock('marked', () => {
  const marked = (s: string) => `<p>${s}</p>`;
  marked.parse = marked;
  return { marked };
});

import { query, closeDatabase } from '@/lib/db';
import {
  sendCampaign, sendConfirmation, confirmByToken, unsubscribeByToken, confirmedRecipients,
} from '@/lib/newsletter/delivery';

const d = TEST_DB ? describe : describe.skip;
const TAG = `jest-${Date.now()}`;
const noSleep = async () => undefined;

async function makeSub(email: string, confirmed: boolean) {
  const r = await query(
    `INSERT INTO newsletter_subscribers (email, is_active, is_confirmed, unsubscribe_token, subscription_source)
     VALUES ($1, true, $2, uuid_generate_v4(), $3) RETURNING id, unsubscribe_token`,
    [email, confirmed, TAG]
  );
  return r.rows[0] as { id: string; unsubscribe_token: string };
}
async function makeCampaign(status = 'draft') {
  const r = await query(
    `INSERT INTO newsletter_campaigns (title, slug, subject, content, type, status)
     VALUES ('Test', $1, 'Test subject', '# Hello', 'manual', $2) RETURNING id`,
    [`${TAG}-${Math.random().toString(36).slice(2)}`, status]
  );
  return r.rows[0].id as string;
}
async function campaign(id: string) {
  return (await query('SELECT status, sent_count, failed_count, recipient_count, last_error, sent_at FROM newsletter_campaigns WHERE id = $1', [id])).rows[0];
}

d('newsletter delivery (DB)', () => {
  let a: { id: string; unsubscribe_token: string };
  let b: { id: string; unsubscribe_token: string };
  let pending: { id: string; unsubscribe_token: string };
  let paused: string[] = [];

  beforeAll(async () => {
    // isolate from any other subscribers in the test DB
    paused = (await query(
      `UPDATE newsletter_subscribers SET is_active = false WHERE subscription_source IS DISTINCT FROM $1 AND is_active RETURNING id`, [TAG]
    )).rows.map((r: { id: string }) => r.id);
    a = await makeSub(`a-${TAG}@local.test`, true);
    b = await makeSub(`b-${TAG}@local.test`, true);
    pending = await makeSub(`p-${TAG}@local.test`, false);
  });

  afterAll(async () => {
    await query(`DELETE FROM newsletter_campaigns WHERE slug LIKE $1`, [`${TAG}-%`]);
    await query(`DELETE FROM newsletter_subscribers WHERE subscription_source = $1`, [TAG]);
    if (paused.length) await query(`UPDATE newsletter_subscribers SET is_active = true WHERE id = ANY($1::uuid[])`, [paused]);
    await closeDatabase();
  });

  it('only confirmed, active subscribers are recipients', async () => {
    const ids = (await confirmedRecipients()).map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining([a.id, b.id]));
    expect(ids).not.toContain(pending.id);
  });

  it('sends to every confirmed subscriber and records it', async () => {
    const id = await makeCampaign();
    const sent: string[] = [];
    const out = await sendCampaign(id, ['draft'], { send: async (m) => { sent.push(m.to); return { ok: true }; }, sleep: noSleep });
    expect(out).toMatchObject({ ok: true, status: 'sent', sent: 2, failed: 0 });
    expect(sent.sort()).toEqual([`a-${TAG}@local.test`, `b-${TAG}@local.test`]);
    expect(await campaign(id)).toMatchObject({ status: 'sent', sent_count: 2, failed_count: 0 });
  });

  it('includes a working unsubscribe link in each email', async () => {
    const id = await makeCampaign();
    const html: Record<string, string> = {};
    await sendCampaign(id, ['draft'], { send: async (m) => { html[m.to] = m.html; return { ok: true }; }, sleep: noSleep });
    expect(html[`a-${TAG}@local.test`]).toContain(a.unsubscribe_token);
  });

  it('marks the campaign failed when Graph rejects a send, and a retry only goes to the ones that failed', async () => {
    const id = await makeCampaign();
    const first = await sendCampaign(id, ['draft'], {
      send: async (m) => (m.to.startsWith('b-') ? { ok: false, status: 403, error: 'Forbidden' } : { ok: true }),
      sleep: noSleep,
    });
    expect(first).toMatchObject({ ok: false, status: 'failed', sent: 1, failed: 1, error: 'Forbidden' });
    expect(await campaign(id)).toMatchObject({ status: 'failed', sent_count: 1, failed_count: 1, last_error: 'Forbidden' });

    const retried: string[] = [];
    const second = await sendCampaign(id, ['failed'], { send: async (m) => { retried.push(m.to); return { ok: true }; }, sleep: noSleep });
    expect(retried).toEqual([`b-${TAG}@local.test`]);
    expect(second).toMatchObject({ ok: true, status: 'sent' });
    expect(await campaign(id)).toMatchObject({ status: 'sent', sent_count: 2, failed_count: 0 });
  });

  it('will not claim a campaign from a state it was not asked to send from', async () => {
    const id = await makeCampaign('cancelled');
    const out = await sendCampaign(id, ['draft', 'scheduled'], { send: async () => ({ ok: true }), sleep: noSleep });
    expect(out.status).toBe('not_sent');
    expect((await campaign(id)).status).toBe('cancelled');
  });

  it('confirmation: email is only marked sent on success; token confirms once', async () => {
    const failed = await sendConfirmation(pending.id, async () => ({ ok: false, status: 500, error: 'boom' }));
    expect(failed.ok).toBe(false);
    let row = (await query('SELECT confirmation_token, confirmation_sent_at FROM newsletter_subscribers WHERE id = $1', [pending.id])).rows[0];
    expect(row.confirmation_sent_at).toBeNull();

    let link = '';
    const ok = await sendConfirmation(pending.id, async (m) => { link = m.html; return { ok: true }; });
    expect(ok.ok).toBe(true);
    row = (await query('SELECT confirmation_token, confirmation_sent_at FROM newsletter_subscribers WHERE id = $1', [pending.id])).rows[0];
    expect(row.confirmation_sent_at).not.toBeNull();
    expect(link).toContain(row.confirmation_token);

    expect(await confirmByToken(row.confirmation_token)).toMatchObject({ ok: true });
    expect((await confirmByToken(row.confirmation_token)).ok).toBe(false);
    const after = (await query('SELECT is_confirmed, gdpr_consent FROM newsletter_subscribers WHERE id = $1', [pending.id])).rows[0];
    expect(after).toEqual({ is_confirmed: true, gdpr_consent: true });
  });

  it('unsubscribe removes the subscriber from recipients', async () => {
    expect(await unsubscribeByToken(a.unsubscribe_token, 'test')).toMatchObject({ ok: true });
    expect((await confirmedRecipients()).map((r) => r.id)).not.toContain(a.id);
    expect((await unsubscribeByToken('not-a-token')).ok).toBe(false);
  });
});
