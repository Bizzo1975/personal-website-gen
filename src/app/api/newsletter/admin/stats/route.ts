import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

const PERIOD_DAYS: Record<string, number | null> = {
  last_7_days: 7,
  last_30_days: 30,
  last_90_days: 90,
  all_time: null,
};

const n = (v: unknown) => Number(v) || 0;

/**
 * Newsletter statistics from the database only (W6/W19).
 * Opens, clicks and bounces are not tracked (no tracking pixel, link redirects or
 * bounce webhook), so they are returned as null and labelled "not tracked".
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = new URL(request.url).searchParams.get('period') || 'last_30_days';
    if (!(period in PERIOD_DAYS)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }
    const days = PERIOD_DAYS[period];
    // $1 is the start of the period, or NULL for all time
    const since = days === null ? null : new Date(Date.now() - days * 86400000);

    const [subs, camps, delivery, growth, sources] = await Promise.all([
      query(`SELECT COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE is_active AND is_confirmed AND unsubscribed_at IS NULL) AS confirmed,
                    COUNT(*) FILTER (WHERE is_active AND is_confirmed IS NOT TRUE AND unsubscribed_at IS NULL) AS pending,
                    COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL OR is_active = false) AS inactive
               FROM newsletter_subscribers`),
      query(`SELECT COUNT(*) FILTER (WHERE status = 'sent') AS sent,
                    COUNT(*) FILTER (WHERE status = 'failed') AS failed,
                    COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
                    COUNT(*) FILTER (WHERE status = 'draft') AS draft
               FROM newsletter_campaigns`),
      query(`SELECT COUNT(*) FILTER (WHERE event_type = 'sent') AS sent,
                    COUNT(*) FILTER (WHERE event_type = 'failed') AS failed
               FROM newsletter_analytics
              WHERE ($1::timestamp IS NULL OR created_at >= $1)`, [since]),
      query(`SELECT COUNT(*) FILTER (WHERE $1::timestamp IS NULL OR created_at >= $1) AS new_subscribers,
                    COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL AND ($1::timestamp IS NULL OR unsubscribed_at >= $1)) AS unsubscribes
               FROM newsletter_subscribers`, [since]),
      query(`SELECT COALESCE(NULLIF(subscription_source, ''), 'unknown') AS source, COUNT(*) AS count
               FROM newsletter_subscribers
              WHERE is_active AND is_confirmed AND unsubscribed_at IS NULL
              GROUP BY 1 ORDER BY 2 DESC`),
    ]);

    const s = subs.rows[0];
    const c = camps.rows[0];
    const d = delivery.rows[0];
    const g = growth.rows[0];
    const emailsSent = n(d.sent);
    const emailsFailed = n(d.failed);
    const attempted = emailsSent + emailsFailed;

    return NextResponse.json({
      period,
      subscribers: { total: n(s.total), confirmed: n(s.confirmed), pending: n(s.pending), inactive: n(s.inactive) },
      campaigns: { sent: n(c.sent), failed: n(c.failed), scheduled: n(c.scheduled), draft: n(c.draft) },
      delivery: {
        emailsSent,
        emailsFailed,
        // null when nothing was attempted: a rate of 0 sends is undefined, not 0%
        failureRate: attempted > 0 ? (emailsFailed / attempted) * 100 : null,
      },
      growth: {
        newSubscribers: n(g.new_subscribers),
        unsubscribes: n(g.unsubscribes),
        netGrowth: n(g.new_subscribers) - n(g.unsubscribes),
      },
      bySource: sources.rows.map((r: { source: string; count: string }) => ({ source: r.source, count: n(r.count) })),
      notTracked: { opens: null, clicks: null, bounces: null },
      // kept for existing callers (content page, dashboard tiles)
      totalSubscribers: n(s.total),
      activeSubscribers: n(s.confirmed),
      totalCampaigns: n(c.sent),
      pendingCampaigns: n(c.scheduled),
    });
  } catch (error) {
    console.error('Newsletter stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
