/**
 * WWFL newsletter delivery (W14–W18). Mail goes out through Microsoft Graph
 * (operator decision 2026-11-20). Rules:
 *  - Double opt-in: only active, confirmed, not-unsubscribed subscribers receive campaigns.
 *  - Every send result is recorded in newsletter_analytics; a campaign is marked
 *    'sent' only when every recipient was accepted by Graph, otherwise 'failed'
 *    with counts and the last error. Nothing is reported as sent that was not.
 *  - A campaign is claimed atomically before sending, so two runs cannot send it twice.
 */
import { marked } from 'marked'
import { query } from '@/lib/db'
import { graphSendMessage, type GraphSendResult } from '@/lib/services/graph-mail'

/** Exchange Online allows 30 messages per minute per mailbox; stay under it. */
export const SEND_INTERVAL_MS = 2100

type Sender = (msg: { to: string; subject: string; html: string }) => Promise<GraphSendResult>
type Sleeper = (ms: number) => Promise<void>

const defaultSleep: Sleeper = (ms) => new Promise((r) => setTimeout(r, ms))

export function siteBaseUrl(): string {
  const base = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || ''
  if (!base) throw new Error('SITE_URL or NEXTAUTH_URL must be set to build newsletter links')
  return base.replace(/\/$/, '')
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

function wrapEmail(inner: string, footer: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937;max-width:640px;margin:0 auto;padding:16px">${inner}<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"><div style="font-size:12px;color:#6b7280">${footer}</div></body></html>`
}

export function unsubscribeUrl(token: string): string {
  return `${siteBaseUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}

export function confirmUrl(token: string): string {
  return `${siteBaseUrl()}/newsletter/confirm?token=${encodeURIComponent(token)}`
}

export function renderCampaignHtml(campaign: { html_content?: string | null; content?: string | null }, unsubscribeToken: string): string {
  const body = campaign.html_content && campaign.html_content.trim()
    ? campaign.html_content
    : (marked.parse(campaign.content || '', { async: false }) as string)
  const footer = `You are receiving this because you subscribed to the Will Work for Lunch newsletter and confirmed your email. <a href="${unsubscribeUrl(unsubscribeToken)}">Unsubscribe</a>.`
  return wrapEmail(body, footer)
}

/** Create or refresh a confirmation token and email the confirmation link. */
export async function sendConfirmation(
  subscriberId: string,
  send: Sender = graphSendMessage
): Promise<GraphSendResult> {
  const r = await query(
    `UPDATE newsletter_subscribers
        SET confirmation_token = COALESCE(confirmation_token, uuid_generate_v4()), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_confirmed IS NOT TRUE
      RETURNING id, email, name, confirmation_token`,
    [subscriberId]
  )
  if (r.rows.length === 0) return { ok: false, error: 'Subscriber not found or already confirmed' }
  const sub = r.rows[0]
  const who = sub.name ? escapeHtml(sub.name) : 'there'
  const link = confirmUrl(sub.confirmation_token)
  const html = wrapEmail(
    `<p>Hi ${who},</p><p>Please confirm that you want to receive the Will Work for Lunch newsletter:</p>` +
      `<p><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Confirm my subscription</a></p>` +
      `<p>If you did not sign up, ignore this email and you will not receive anything.</p>`,
    'Will Work for Lunch · willworkforlunch.com'
  )
  const result = await send({ to: sub.email, subject: 'Confirm your Will Work for Lunch newsletter subscription', html })
  if (result.ok) {
    await query('UPDATE newsletter_subscribers SET confirmation_sent_at = CURRENT_TIMESTAMP WHERE id = $1', [sub.id])
  }
  return result
}

/** Confirm by token: records consent (GDPR) and clears the token. */
export async function confirmByToken(token: string): Promise<{ ok: boolean; email?: string; error?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { ok: false, error: 'Invalid confirmation link' }
  const r = await query(
    `UPDATE newsletter_subscribers
        SET is_confirmed = true, confirmed_at = CURRENT_TIMESTAMP, confirmation_token = NULL,
            gdpr_consent = true, gdpr_consent_date = CURRENT_TIMESTAMP,
            is_active = true, unsubscribed_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE confirmation_token = $1
      RETURNING email`,
    [token]
  )
  if (r.rows.length === 0) return { ok: false, error: 'This confirmation link is invalid or has already been used' }
  return { ok: true, email: r.rows[0].email }
}

export async function unsubscribeByToken(token: string, reason?: string | null): Promise<{ ok: boolean; email?: string; error?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { ok: false, error: 'Invalid unsubscribe link' }
  const r = await query(
    `UPDATE newsletter_subscribers
        SET is_active = false, unsubscribed_at = COALESCE(unsubscribed_at, CURRENT_TIMESTAMP),
            unsubscribe_reason = COALESCE($2, unsubscribe_reason), updated_at = CURRENT_TIMESTAMP
      WHERE unsubscribe_token = $1
      RETURNING email`,
    [token, reason ? String(reason).slice(0, 1000) : null]
  )
  if (r.rows.length === 0) return { ok: false, error: 'This unsubscribe link is invalid' }
  return { ok: true, email: r.rows[0].email }
}

export async function confirmedRecipients(): Promise<Array<{ id: string; email: string; unsubscribe_token: string }>> {
  const r = await query(
    `SELECT id, email, unsubscribe_token FROM newsletter_subscribers
      WHERE is_active = true AND is_confirmed = true AND unsubscribed_at IS NULL AND unsubscribe_token IS NOT NULL
      ORDER BY created_at`
  )
  return r.rows
}

export type CampaignSendOutcome = {
  ok: boolean
  status: 'sent' | 'failed' | 'not_sent'
  recipients: number
  sent: number
  failed: number
  error?: string
}

/**
 * Send a campaign now. `from` lists the statuses it may be claimed from
 * (the scheduler claims 'scheduled'; "Send now" claims 'draft' or 'scheduled').
 */
export async function sendCampaign(
  campaignId: string,
  from: Array<'draft' | 'scheduled' | 'failed'>,
  deps: { send?: Sender; sleep?: Sleeper } = {}
): Promise<CampaignSendOutcome> {
  const send = deps.send || graphSendMessage
  const sleep = deps.sleep || defaultSleep
  // Never send the same campaign twice to one subscriber (matters when a failed
  // campaign is retried): skip anyone already recorded as 'sent' for it.
  const already = await query(
    `SELECT DISTINCT subscriber_id FROM newsletter_analytics WHERE campaign_id = $1 AND event_type = 'sent'`,
    [campaignId]
  )
  const done = new Set(already.rows.map((r: { subscriber_id: string }) => r.subscriber_id))
  const recipients = (await confirmedRecipients()).filter((r) => !done.has(r.id))
  if (recipients.length === 0) {
    return {
      ok: false, status: 'not_sent', recipients: 0, sent: 0, failed: 0,
      error: done.size > 0 ? 'Every confirmed subscriber has already received this campaign' : 'There are no confirmed subscribers to send to',
    }
  }
  const claim = await query(
    `UPDATE newsletter_campaigns
        SET status = 'sending', send_started_at = CURRENT_TIMESTAMP, last_error = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = ANY($2::text[])
      RETURNING id, subject, title, content, html_content`,
    [campaignId, from]
  )
  if (claim.rows.length === 0) {
    return { ok: false, status: 'not_sent', recipients: recipients.length, sent: 0, failed: 0, error: 'Campaign not found or not in a sendable state' }
  }
  const campaign = claim.rows[0]
  const subject = campaign.subject || campaign.title
  let sent = 0
  let failed = 0
  let lastError: string | undefined
  try {
  for (let i = 0; i < recipients.length; i++) {
    const rcpt = recipients[i]
    let result: GraphSendResult
    try {
      result = await send({ to: rcpt.email, subject, html: renderCampaignHtml(campaign, rcpt.unsubscribe_token) })
    } catch (e) {
      result = { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
    if (result.ok) sent++
    else { failed++; lastError = result.error }
    await query(
      `INSERT INTO newsletter_analytics (campaign_id, subscriber_id, email, event_type, event_data, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [campaign.id, rcpt.id, rcpt.email, result.ok ? 'sent' : 'failed', result.ok ? {} : { error: result.error, status: (result as { status?: number }).status ?? null }]
    )
    if (i < recipients.length - 1) await sleep(SEND_INTERVAL_MS)
  }
  } catch (e) {
    // A database error mid-send must not leave the campaign stuck in 'sending'.
    const msg = `Send stopped after ${sent} sent / ${failed} failed: ${e instanceof Error ? e.message : String(e)}`
    await query(
      `UPDATE newsletter_campaigns SET status = 'failed', sent_count = $2, failed_count = $3, last_error = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [campaign.id, sent, failed, msg]
    ).catch(() => undefined)
    return { ok: false, status: 'failed', recipients: recipients.length, sent, failed, error: msg }
  }
  const status: 'sent' | 'failed' = failed === 0 ? 'sent' : 'failed'
  const totals = await query(
    `SELECT COUNT(DISTINCT subscriber_id) FILTER (WHERE event_type = 'sent') AS delivered
       FROM newsletter_analytics WHERE campaign_id = $1`,
    [campaign.id]
  )
  const delivered = parseInt(totals.rows[0]?.delivered || '0')
  await query(
    `UPDATE newsletter_campaigns
        SET status = $2, sent_at = CASE WHEN $3::int > 0 THEN CURRENT_TIMESTAMP ELSE sent_at END,
            recipient_count = $4, sent_count = $4, failed_count = $5, last_error = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [campaign.id, status, sent, delivered, failed, lastError || null]
  )
  return { ok: failed === 0, status, recipients: recipients.length, sent, failed, error: lastError }
}
