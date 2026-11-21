/**
 * W46: access requests and gated-content access, one implementation for every route.
 *
 * Replaces two overlapping services whose faults were verified in code:
 * - approving "personal" access set has_professional_access = false (and the reverse),
 *   so approving one level silently revoked the other;
 * - approving "professional" created the account with role 'author' (a content role);
 * - the account got a random password that nobody received (with SendGrid configured the
 *   email had no password and the API masked it), so approved people could not sign in;
 * - an already decided request could be approved/rejected again; the "transaction" ran
 *   BEGIN/COMMIT on random pool connections;
 * - new requests notified nobody; mail went through SMTP or SendGrid, not Graph.
 *
 * Now: decisions run in one DB transaction, only on pending requests; access is added,
 * never removed; a new account is a 'subscriber' with no usable password and gets a
 * one-time link to set one (verification_tokens, stored as a SHA-256 hash, 7 days);
 * all mail goes through Microsoft Graph and its real outcome is returned.
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import { getClient, query } from '@/lib/db';
import { graphSendMessage, type GraphSendResult } from '@/lib/services/graph-mail';
import { escapeHtml, siteBaseUrl } from '@/lib/newsletter/delivery';

export const ACCESS_LEVELS = ['personal', 'professional'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];
export const SET_PASSWORD_TTL_HOURS = 24 * 7;
const TOKEN_PREFIX = 'set-password:';

export type MailOutcome = { sent: boolean; error?: string; skipped?: string };
const outcome = (r: GraphSendResult): MailOutcome => (r.ok ? { sent: true } : { sent: false, error: r.error });

function wrap(inner: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937;max-width:640px;margin:0 auto;padding:16px">${inner}</body></html>`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

// ---------------------------------------------------------------- submit

export async function submitAccessRequest(data: { name: string; email: string; level: AccessLevel; message: string }) {
  const email = normalizeEmail(data.email);
  const r = await query(
    `INSERT INTO access_requests (name, email, subject, message, request_type, requested_access_level, status, submitted_at)
     VALUES ($1, $2, $3, $4, 'access_request', $5, 'pending', CURRENT_TIMESTAMP)
     RETURNING *`,
    [data.name.trim(), email, `Access Request - ${data.level}`, data.message.trim() || `Requesting ${data.level} access`, data.level]
  );
  const request = r.rows[0];
  const admin = process.env.ADMIN_EMAIL;
  let adminNotified: MailOutcome;
  if (!admin) {
    adminNotified = { sent: false, skipped: 'ADMIN_EMAIL is not set' };
  } else {
    let link = '';
    try { link = `${siteBaseUrl()}/admin/access-requests`; } catch { /* no base URL: send without a link */ }
    adminNotified = outcome(await graphSendMessage({
      to: admin,
      replyTo: email,
      subject: `New ${data.level} access request from ${data.name.trim()}`,
      html: wrap(
        `<p><strong>${escapeHtml(data.name.trim())}</strong> (${escapeHtml(email)}) asked for <strong>${data.level}</strong> access.</p>` +
        `<blockquote style="border-left:3px solid #e5e7eb;margin:0;padding-left:12px">${escapeHtml(request.message)}</blockquote>` +
        (link ? `<p><a href="${link}">Review access requests</a></p>` : '')
      ),
    }));
  }
  if (!adminNotified.sent) console.warn('Access request saved; admin notification not sent:', adminNotified.error || adminNotified.skipped);
  return { request, adminNotified };
}

// ---------------------------------------------------------------- decide

export class DecisionError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type Decision = {
  request: Record<string, unknown>;
  accountCreated: boolean;
  setPasswordToken?: string;
};

async function grantInTx(c: PoolClient, email: string, level: AccessLevel, adminUserId: string) {
  // Additive: the other level is never touched.
  await c.query(
    `INSERT INTO user_access_levels (email, has_professional_access, has_personal_access, granted_at, granted_by, is_active, notes)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, true, 'Access granted through approved access request')
     ON CONFLICT (email) DO UPDATE SET
       has_professional_access = user_access_levels.has_professional_access OR EXCLUDED.has_professional_access,
       has_personal_access = user_access_levels.has_personal_access OR EXCLUDED.has_personal_access,
       granted_at = CURRENT_TIMESTAMP, granted_by = EXCLUDED.granted_by, is_active = true`,
    [email, level === 'professional', level === 'personal', adminUserId]
  );
}

async function createAccountInTx(c: PoolClient, name: string, email: string): Promise<string | null> {
  const existing = await c.query('SELECT id FROM users WHERE lower(email) = $1', [email]);
  if (existing.rows.length) return null;
  // No usable password: the person sets one through the emailed link.
  const unusable = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
  const user = await c.query(
    `INSERT INTO users (name, email, password_hash, role, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, 'subscriber', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
    [name.trim() || email, email, unusable]
  );
  const token = crypto.randomBytes(32).toString('base64url');
  await c.query(`DELETE FROM verification_tokens WHERE identifier = $1`, [TOKEN_PREFIX + email]);
  await c.query(
    `INSERT INTO verification_tokens (identifier, token, expires) VALUES ($1, $2, CURRENT_TIMESTAMP + ($3 || ' hours')::interval)`,
    [TOKEN_PREFIX + email, hashToken(token), String(SET_PASSWORD_TTL_HOURS)]
  );
  await c.query(`UPDATE user_access_levels SET user_id = $1 WHERE email = $2 AND user_id IS NULL`, [user.rows[0].id, email]);
  return token;
}

/** Approve or reject one pending request in a single transaction. */
export async function decideAccessRequest(
  id: string,
  action: 'approve' | 'reject',
  adminUserId: string,
  adminNotes: string | null,
  createAccount = true
): Promise<Decision> {
  const c = await getClient();
  try {
    await c.query('BEGIN');
    const r = await c.query(`SELECT * FROM access_requests WHERE id = $1 AND request_type = 'access_request' FOR UPDATE`, [id]);
    if (!r.rows.length) throw new DecisionError(404, 'Access request not found');
    if (r.rows[0].status !== 'pending') throw new DecisionError(409, `This request was already ${r.rows[0].status}`);
    const u = await c.query(
      `UPDATE access_requests SET status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2, admin_notes = $3
       WHERE id = $4 RETURNING *`,
      [action === 'approve' ? 'approved' : 'rejected', adminUserId, adminNotes, id]
    );
    const request = u.rows[0];
    let token: string | null = null;
    if (action === 'approve') {
      const email = normalizeEmail(request.email);
      await grantInTx(c, email, request.requested_access_level, adminUserId);
      if (createAccount) token = await createAccountInTx(c, request.name, email);
    }
    await c.query('COMMIT');
    return { request, accountCreated: Boolean(token), ...(token ? { setPasswordToken: token } : {}) };
  } catch (e) {
    await c.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}

/** Tell the requester; the decision is already committed, so a mail failure is reported, not thrown. */
export async function notifyDecision(d: Decision, action: 'approve' | 'reject'): Promise<MailOutcome> {
  const req = d.request as { name: string; email: string; requested_access_level: string };
  const who = escapeHtml((req.name || '').trim() || 'there');
  let base = '';
  try { base = siteBaseUrl(); } catch { /* handled below */ }
  if (action === 'reject') {
    return outcome(await graphSendMessage({
      to: req.email,
      subject: 'About your access request',
      html: wrap(`<p>Hi ${who},</p><p>Thank you for your interest. Your request for ${escapeHtml(req.requested_access_level)} access was not approved.</p>`),
    }));
  }
  if (d.setPasswordToken && !base) return { sent: false, error: 'SITE_URL or NEXTAUTH_URL is not set, so no sign-in link could be built' };
  const signIn = base ? `${base}/login` : '';
  const setLink = d.setPasswordToken
    ? `${base}/set-password?email=${encodeURIComponent(req.email)}&token=${encodeURIComponent(d.setPasswordToken)}`
    : '';
  const account = d.setPasswordToken
    ? `<p>Your account is ready. Choose a password to sign in (this link works once and expires in 7 days):</p><p><a href="${setLink}">Set your password</a></p>`
    : `<p>Sign in with your existing account to see it${signIn ? `: <a href="${signIn}">${signIn}</a>` : '.'}</p>`;

  // Site Settings > Access Request Welcome Email (was only honoured on the SendGrid path).
  const w = await welcomeSettings();
  if (!w.enabled && !d.setPasswordToken) return { sent: false, skipped: 'Welcome e-mail is turned off in Site Settings' };
  const name = (req.name || '').trim() || 'there';
  const fill = (s: string, esc: (v: string) => string) => s
    .replace(/\{userName\}/g, esc(name))
    .replace(/\{accessLevel\}/g, esc(req.requested_access_level))
    .replace(/\{websiteUrl\}/g, esc(base));
  const intro = w.enabled && w.message
    ? fill(w.message, escapeHtml) // admin-written HTML; only the placeholder values are escaped
    : `<p>Hi ${who},</p><p>Your request for ${escapeHtml(req.requested_access_level)} access was approved.</p>`;
  const subject = w.enabled && w.subject ? fill(w.subject, v => v) : 'Your access request was approved';
  return outcome(await graphSendMessage({ to: req.email, subject, html: wrap(intro + account) }));
}

async function welcomeSettings(): Promise<{ enabled: boolean; subject: string; message: string }> {
  const r = await query(
    `SELECT setting_key, setting_value FROM site_settings
      WHERE setting_key IN ('accessRequestWelcomeEmailEnabled', 'accessRequestWelcomeEmailSubject', 'accessRequestWelcomeEmailMessage')`
  );
  const v: Record<string, string> = {};
  for (const row of r.rows) {
    let s = row.setting_value;
    try { s = JSON.parse(s); } catch { /* stored as plain text */ }
    v[row.setting_key] = typeof s === 'string' ? s : String(s);
  }
  return {
    enabled: v.accessRequestWelcomeEmailEnabled !== 'false',
    subject: (v.accessRequestWelcomeEmailSubject || '').trim(),
    message: (v.accessRequestWelcomeEmailMessage || '').trim(),
  };
}

// ---------------------------------------------------------------- set password

export async function setPasswordWithToken(emailRaw: string, token: string, password: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const email = normalizeEmail(emailRaw);
  if (password.length < 12 || password.length > 200) return { ok: false, status: 400, error: 'Use a password of 12 to 200 characters' };
  const c = await getClient();
  try {
    await c.query('BEGIN');
    const t = await c.query(
      `DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2 RETURNING expires`,
      [TOKEN_PREFIX + email, hashToken(token)]
    );
    if (!t.rows.length) { await c.query('ROLLBACK'); return { ok: false, status: 400, error: 'This link is not valid. It may have been used already.' }; }
    if (new Date(t.rows[0].expires).getTime() < Date.now()) { await c.query('COMMIT'); return { ok: false, status: 400, error: 'This link has expired. Ask for a new one.' }; }
    const u = await c.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE lower(email) = $2 RETURNING id`,
      [await bcrypt.hash(password, 12), email]
    );
    if (!u.rows.length) { await c.query('ROLLBACK'); return { ok: false, status: 400, error: 'No account exists for this link' }; }
    await c.query('COMMIT');
    return { ok: true };
  } catch (e) {
    await c.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}

// ---------------------------------------------------------------- reads

export async function listAccessRequests(status: string | null, level: string | null) {
  const where: string[] = [`ar.request_type = 'access_request'`];
  const params: unknown[] = [];
  if (status) { params.push(status); where.push(`ar.status = $${params.length}`); }
  if (level) { params.push(level); where.push(`ar.requested_access_level = $${params.length}`); }
  const r = await query(
    `SELECT ar.*, u.name AS processed_by_name FROM access_requests ar
       LEFT JOIN users u ON ar.processed_by = u.id
      WHERE ${where.join(' AND ')} ORDER BY ar.submitted_at DESC`,
    params
  );
  return r.rows.map(row => ({
    ...row,
    _id: row.id,
    accessLevel: row.requested_access_level,
    submittedAt: row.submitted_at,
    processedAt: row.processed_at,
    processedBy: row.processed_by_name || row.processed_by,
    adminNotes: row.admin_notes,
  }));
}

export async function accessRequestStats() {
  const r = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
            COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
            COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
            COUNT(*) FILTER (WHERE requested_access_level = 'professional')::int AS professional,
            COUNT(*) FILTER (WHERE requested_access_level = 'personal')::int AS personal
       FROM access_requests WHERE request_type = 'access_request'`
  );
  return r.rows[0];
}

export async function latestRequestFor(email: string, level: AccessLevel) {
  const r = await query(
    `SELECT status FROM access_requests WHERE email = $1 AND requested_access_level = $2 AND request_type = 'access_request'
      ORDER BY submitted_at DESC LIMIT 1`,
    [normalizeEmail(email), level]
  );
  return r.rows[0] ?? null;
}

export async function hasAccess(email: string, level: AccessLevel): Promise<boolean> {
  const col = level === 'professional' ? 'has_professional_access' : 'has_personal_access';
  const r = await query(`SELECT ${col} AS ok FROM user_access_levels WHERE email = $1 AND is_active = true`, [normalizeEmail(email)]);
  return r.rows[0]?.ok === true;
}

export async function adminUserIdFor(email: string): Promise<string | null> {
  const r = await query(`SELECT id FROM users WHERE lower(email) = $1 AND role = 'admin'`, [normalizeEmail(email)]);
  return r.rows[0]?.id ?? null;
}
