/**
 * @jest-environment node
 */
const sent: Array<{ to: string; subject: string; html: string }> = [];
let settings: Record<string, string> = {};
jest.mock('@/lib/services/graph-mail', () => ({
  graphSendMessage: jest.fn(async (m: { to: string; subject: string; html: string }) => { sent.push(m); return { ok: true }; }),
}));
jest.mock('@/lib/db', () => ({
  query: jest.fn(async () => ({ rows: Object.entries(settings).map(([setting_key, setting_value]) => ({ setting_key, setting_value })) })),
  getClient: jest.fn(),
}));
// marked is ESM-only; the newsletter module imported alongside only needs it at send time.
jest.mock('marked', () => ({ marked: Object.assign((s: string) => s, { parse: (s: string) => s }) }));
import { notifyDecision } from '@/lib/access-requests/service';

const request = { name: 'Ann <b>', email: 'ann@x.test', requested_access_level: 'professional' };

describe('access request decision e-mails (W46)', () => {
  beforeEach(() => { sent.length = 0; settings = {}; process.env.SITE_URL = 'https://site.test'; });

  it('a new account gets a one-time set-password link; names are escaped', async () => {
    const r = await notifyDecision({ request, accountCreated: true, setPasswordToken: 'tok/+=' }, 'approve');
    expect(r).toEqual({ sent: true });
    expect(sent[0].to).toBe('ann@x.test');
    expect(sent[0].html).toContain('https://site.test/set-password?email=ann%40x.test&token=tok%2F%2B%3D');
    expect(sent[0].html).toContain('Ann &lt;b&gt;');
    expect(sent[0].html).not.toContain('Ann <b>');
  });

  it('an existing account is pointed at the reader sign-in page', async () => {
    await notifyDecision({ request, accountCreated: false }, 'approve');
    expect(sent[0].html).toContain('https://site.test/login');
    expect(sent[0].html).not.toContain('set-password');
  });

  it('uses the Site Settings subject and message with placeholders', async () => {
    settings = { accessRequestWelcomeEmailSubject: 'Hi {userName} ({accessLevel})', accessRequestWelcomeEmailMessage: '<p>Welcome {userName} to {websiteUrl}</p>' };
    await notifyDecision({ request, accountCreated: false }, 'approve');
    expect(sent[0].subject).toBe('Hi Ann <b> (professional)');
    expect(sent[0].html).toContain('<p>Welcome Ann &lt;b&gt; to https://site.test</p>');
  });

  it('welcome turned off: nothing sent, unless the person needs the set-password link', async () => {
    settings = { accessRequestWelcomeEmailEnabled: 'false' };
    expect(await notifyDecision({ request, accountCreated: false }, 'approve')).toEqual({ sent: false, skipped: 'Welcome e-mail is turned off in Site Settings' });
    expect(sent).toHaveLength(0);
    await notifyDecision({ request, accountCreated: true, setPasswordToken: 't' }, 'approve');
    expect(sent).toHaveLength(1);
    expect(sent[0].html).toContain('set-password');
  });

  it('no site URL: a set-password link cannot be built and that is reported', async () => {
    delete process.env.SITE_URL; delete process.env.NEXT_PUBLIC_SITE_URL; delete process.env.NEXTAUTH_URL;
    const r = await notifyDecision({ request, accountCreated: true, setPasswordToken: 't' }, 'approve');
    expect(r.sent).toBe(false);
    expect(sent).toHaveLength(0);
  });

  it('rejection mail', async () => {
    await notifyDecision({ request, accountCreated: false }, 'reject');
    expect(sent[0].subject).toBe('About your access request');
    expect(sent[0].html).toContain('was not approved');
  });
});
