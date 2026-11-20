import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { sendTargetedEmail } from '@/lib/newsletter/delivery';

// Segments resolve to subscriber ids; the delivery engine then sends only to the
// ones that are confirmed and active (W15: real send through Microsoft Graph).
const SEGMENTS: Record<string, string> = {
  all: `SELECT id FROM newsletter_subscribers WHERE is_active = true AND is_confirmed = true`,
  active: `SELECT id FROM newsletter_subscribers WHERE is_active = true AND is_confirmed = true AND unsubscribed_at IS NULL`,
  new: `SELECT id FROM newsletter_subscribers WHERE is_active = true AND is_confirmed = true
          AND subscription_date >= NOW() - INTERVAL '30 days'`,
  high_engagement: `SELECT ns.id FROM newsletter_subscribers ns
          JOIN (SELECT subscriber_id,
                       COUNT(*) FILTER (WHERE event_type = 'sent') AS sent_count,
                       COUNT(*) FILTER (WHERE event_type = 'opened') AS opened_count
                  FROM newsletter_analytics GROUP BY subscriber_id) a ON a.subscriber_id = ns.id
         WHERE ns.is_active = true AND ns.is_confirmed = true
           AND a.sent_count > 0 AND a.opened_count::float / a.sent_count > 0.5`,
  low_engagement: `SELECT ns.id FROM newsletter_subscribers ns
          JOIN (SELECT subscriber_id,
                       COUNT(*) FILTER (WHERE event_type = 'sent') AS sent_count,
                       COUNT(*) FILTER (WHERE event_type = 'opened') AS opened_count
                  FROM newsletter_analytics GROUP BY subscriber_id) a ON a.subscriber_id = ns.id
         WHERE ns.is_active = true AND ns.is_confirmed = true
           AND a.sent_count > 0 AND a.opened_count::float / a.sent_count < 0.2`,
};

// POST - send an email now to one subscriber, a list of subscribers, or a segment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userResult = await query('SELECT role FROM users WHERE email = $1', [session.user.email]);
    if (!userResult.rows[0] || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { subscriber_id, subscriber_ids, segment, subject, content, html_content, schedule_at, preview } = body;

    // preview: report how many subscribers would receive it, without sending anything.
    if (preview === true) {
      const counts: Record<string, number> = {};
      for (const [name, sql] of Object.entries(SEGMENTS)) {
        const r = await query(
          `SELECT COUNT(*)::int AS n FROM newsletter_subscribers
            WHERE id IN (${sql}) AND unsubscribed_at IS NULL AND unsubscribe_token IS NOT NULL`
        );
        counts[name] = r.rows[0].n;
      }
      return NextResponse.json({ success: true, counts });
    }

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }
    if (schedule_at) {
      return NextResponse.json(
        { error: 'Targeted emails are sent immediately. To send later, create a scheduled campaign.' },
        { status: 400 }
      );
    }

    let ids: string[] = [];
    if (subscriber_id) {
      ids = [String(subscriber_id)];
    } else if (Array.isArray(subscriber_ids)) {
      ids = subscriber_ids.map(String);
    } else if (segment) {
      const sql = SEGMENTS[String(segment)];
      if (!sql) return NextResponse.json({ error: 'Invalid segment specified' }, { status: 400 });
      ids = (await query(sql)).rows.map((r: { id: string }) => r.id);
    } else {
      return NextResponse.json({ error: 'Must specify subscriber_id, subscriber_ids, or segment' }, { status: 400 });
    }

    const outcome = await sendTargetedEmail({
      subscriberIds: ids,
      subject: String(subject),
      content: String(content),
      htmlContent: html_content || null,
      author: session.user.name || session.user.email,
      createdBy: session.user.id || null,
    });

    if (outcome.status === 'not_sent') {
      return NextResponse.json({ success: false, error: outcome.error, outcome }, { status: 409 });
    }
    return NextResponse.json(
      {
        success: outcome.ok,
        message: outcome.ok
          ? `Email sent to ${outcome.sent} of ${outcome.recipients} subscribers`
          : `Sent ${outcome.sent}, failed ${outcome.failed} of ${outcome.recipients}. Last error: ${outcome.error}`,
        campaign_id: outcome.campaignId,
        outcome,
      },
      { status: outcome.ok ? 200 : 502 }
    );
  } catch (error) {
    console.error('Error sending targeted email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
