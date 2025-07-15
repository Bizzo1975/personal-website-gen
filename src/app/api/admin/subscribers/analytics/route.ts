import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Fetch comprehensive subscriber analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const userResult = await query(
      'SELECT role FROM users WHERE email = $1',
      [session.user.email]
    );

    if (!userResult.rows[0] || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';
    
    // Calculate date range
    const daysAgo = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange] || 30;

    // Get basic subscriber counts
    const subscriberStatsResult = await query(`
      SELECT 
        COUNT(*) as total_subscribers,
        COUNT(CASE WHEN is_active = true AND is_confirmed = true AND unsubscribed_at IS NULL THEN 1 END) as active_subscribers,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_subscribers,
        COUNT(CASE WHEN is_confirmed = true THEN 1 END) as confirmed_subscribers,
        COUNT(CASE WHEN is_confirmed = false THEN 1 END) as pending_subscribers,
        COUNT(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 END) as unsubscribed_subscribers,
        COUNT(CASE WHEN gdpr_consent = true THEN 1 END) as gdpr_consented,
        COUNT(CASE WHEN gdpr_consent = false THEN 1 END) as gdpr_pending,
        COUNT(CASE WHEN data_retention_date < NOW() THEN 1 END) as gdpr_expired
      FROM newsletter_subscribers
    `);

    const stats = subscriberStatsResult.rows[0];

    // Calculate growth rate (compare to previous period)
    const growthResult = await query(`
      SELECT 
        COUNT(CASE WHEN subscription_date >= NOW() - INTERVAL '${daysAgo} days' THEN 1 END) as current_period,
        COUNT(CASE WHEN subscription_date >= NOW() - INTERVAL '${daysAgo * 2} days' 
                    AND subscription_date < NOW() - INTERVAL '${daysAgo} days' THEN 1 END) as previous_period
      FROM newsletter_subscribers
    `);

    const growth = growthResult.rows[0];
    const growth_rate = growth.previous_period > 0 
      ? ((growth.current_period - growth.previous_period) / growth.previous_period) * 100 
      : 0;

    // Calculate churn rate
    const churnResult = await query(`
      SELECT 
        COUNT(CASE WHEN unsubscribed_at >= NOW() - INTERVAL '${daysAgo} days' THEN 1 END) as recent_unsubscribes,
        COUNT(CASE WHEN subscription_date >= NOW() - INTERVAL '${daysAgo} days' THEN 1 END) as recent_subscriptions
      FROM newsletter_subscribers
    `);

    const churn = churnResult.rows[0];
    const churn_rate = churn.recent_subscriptions > 0 
      ? (churn.recent_unsubscribes / churn.recent_subscriptions) * 100 
      : 0;

    // Get engagement metrics
    const engagementResult = await query(`
      SELECT 
        AVG(CASE WHEN total_sent > 0 THEN (total_opened::float / total_sent::float) * 100 ELSE 0 END) as avg_open_rate,
        AVG(CASE WHEN total_sent > 0 THEN (total_clicked::float / total_sent::float) * 100 ELSE 0 END) as avg_click_rate
      FROM (
        SELECT 
          ns.id,
          COALESCE(sent_count.total, 0) as total_sent,
          COALESCE(opened_count.total, 0) as total_opened,
          COALESCE(clicked_count.total, 0) as total_clicked
        FROM newsletter_subscribers ns
        LEFT JOIN (
          SELECT subscriber_id, COUNT(*) as total 
          FROM newsletter_analytics 
          WHERE event_type = 'sent' 
          GROUP BY subscriber_id
        ) sent_count ON ns.id = sent_count.subscriber_id
        LEFT JOIN (
          SELECT subscriber_id, COUNT(*) as total 
          FROM newsletter_analytics 
          WHERE event_type = 'opened' 
          GROUP BY subscriber_id
        ) opened_count ON ns.id = opened_count.subscriber_id
        LEFT JOIN (
          SELECT subscriber_id, COUNT(*) as total 
          FROM newsletter_analytics 
          WHERE event_type = 'clicked' 
          GROUP BY subscriber_id
        ) clicked_count ON ns.id = clicked_count.subscriber_id
      ) engagement_stats
    `);

    const engagement = engagementResult.rows[0];

    // Get subscription sources
    const sourcesResult = await query(`
      SELECT 
        subscription_source,
        COUNT(*) as count
      FROM newsletter_subscribers
      GROUP BY subscription_source
      ORDER BY count DESC
    `);

    const subscription_sources = sourcesResult.rows.reduce((acc, row) => {
      acc[row.subscription_source] = parseInt(row.count);
      return acc;
    }, {});

    // Get geographic distribution
    const geoResult = await query(`
      SELECT 
        metadata->>'location'->>'country' as country,
        COUNT(*) as count
      FROM newsletter_subscribers
      WHERE metadata->>'location'->>'country' IS NOT NULL
      GROUP BY metadata->>'location'->>'country'
      ORDER BY count DESC
      LIMIT 10
    `);

    const geographic_distribution = geoResult.rows.reduce((acc, row) => {
      if (row.country) {
        acc[row.country] = parseInt(row.count);
      }
      return acc;
    }, {});

    // Get device breakdown
    const deviceResult = await query(`
      SELECT 
        CASE 
          WHEN metadata->>'user_agent' ILIKE '%mobile%' THEN 'mobile'
          WHEN metadata->>'user_agent' ILIKE '%tablet%' THEN 'tablet'
          ELSE 'desktop'
        END as device_type,
        COUNT(*) as count
      FROM newsletter_subscribers
      WHERE metadata->>'user_agent' IS NOT NULL
      GROUP BY device_type
    `);

    const device_breakdown = deviceResult.rows.reduce((acc, row) => {
      acc[row.device_type] = parseInt(row.count);
      return acc;
    }, {});

    // Get top interests
    const interestsResult = await query(`
      SELECT 
        unnest(interests) as interest,
        COUNT(*) as count
      FROM newsletter_subscribers
      WHERE interests IS NOT NULL AND array_length(interests, 1) > 0
      GROUP BY interest
      ORDER BY count DESC
      LIMIT 10
    `);

    const top_interests = interestsResult.rows.reduce((acc, row) => {
      acc[row.interest] = parseInt(row.count);
      return acc;
    }, {});

    // Get engagement trends (daily data for the specified period)
    const trendsResult = await query(`
      SELECT 
        date_trunc('day', subscription_date) as date,
        COUNT(*) as new_subscribers,
        COUNT(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 END) as unsubscribes
      FROM newsletter_subscribers
      WHERE subscription_date >= NOW() - INTERVAL '${daysAgo} days'
      GROUP BY date_trunc('day', subscription_date)
      ORDER BY date
    `);

    // Get analytics data for engagement trends
    const analyticsResult = await query(`
      SELECT 
        date_trunc('day', created_at) as date,
        COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opens,
        COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicks
      FROM newsletter_analytics
      WHERE created_at >= NOW() - INTERVAL '${daysAgo} days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY date
    `);

    // Merge trends data
    const trendsMap = new Map();
    trendsResult.rows.forEach(row => {
      const dateKey = row.date.toISOString().split('T')[0];
      trendsMap.set(dateKey, {
        date: dateKey,
        new_subscribers: parseInt(row.new_subscribers),
        unsubscribes: parseInt(row.unsubscribes),
        opens: 0,
        clicks: 0
      });
    });

    analyticsResult.rows.forEach(row => {
      const dateKey = row.date.toISOString().split('T')[0];
      const existing = trendsMap.get(dateKey);
      if (existing) {
        existing.opens = parseInt(row.opens);
        existing.clicks = parseInt(row.clicks);
      } else {
        trendsMap.set(dateKey, {
          date: dateKey,
          new_subscribers: 0,
          unsubscribes: 0,
          opens: parseInt(row.opens),
          clicks: parseInt(row.clicks)
        });
      }
    });

    const engagement_trends = Array.from(trendsMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get content preferences
    const preferencesResult = await query(`
      SELECT 
        jsonb_object_keys(preferences->'content_types') as content_type,
        COUNT(*) as count
      FROM newsletter_subscribers
      WHERE preferences IS NOT NULL 
        AND preferences->'content_types' IS NOT NULL
      GROUP BY content_type
      ORDER BY count DESC
    `);

    const content_preferences = preferencesResult.rows.reduce((acc, row) => {
      acc[row.content_type] = parseInt(row.count);
      return acc;
    }, {});

    // Compile final analytics object
    const analytics = {
      total_subscribers: parseInt(stats.total_subscribers),
      active_subscribers: parseInt(stats.active_subscribers),
      inactive_subscribers: parseInt(stats.inactive_subscribers),
      confirmed_subscribers: parseInt(stats.confirmed_subscribers),
      pending_subscribers: parseInt(stats.pending_subscribers),
      unsubscribed_subscribers: parseInt(stats.unsubscribed_subscribers),
      bounced_subscribers: 0, // Would need bounce tracking
      growth_rate: parseFloat(growth_rate.toFixed(2)),
      churn_rate: parseFloat(churn_rate.toFixed(2)),
      average_open_rate: parseFloat((engagement.avg_open_rate || 0).toFixed(2)),
      average_click_rate: parseFloat((engagement.avg_click_rate || 0).toFixed(2)),
      subscription_sources,
      geographic_distribution,
      device_breakdown,
      content_preferences,
      engagement_trends,
      top_interests,
      gdpr_compliance: {
        consented: parseInt(stats.gdpr_consented),
        pending_consent: parseInt(stats.gdpr_pending),
        expired_consent: parseInt(stats.gdpr_expired)
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching subscriber analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 