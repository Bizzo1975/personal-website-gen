import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// POST - Send targeted email to specific subscriber or group
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      subscriber_id,
      subscriber_ids,
      segment,
      subject,
      content,
      html_content,
      template_id,
      schedule_at,
      send_immediately = false
    } = body;

    // Validation
    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    let targetSubscribers = [];

    if (subscriber_id) {
      // Single subscriber
      const subscriberResult = await query(
        'SELECT * FROM newsletter_subscribers WHERE id = $1 AND is_active = true',
        [subscriber_id]
      );
      
      if (subscriberResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Subscriber not found or inactive' },
          { status: 404 }
        );
      }
      
      targetSubscribers = subscriberResult.rows;
      
    } else if (subscriber_ids && Array.isArray(subscriber_ids)) {
      // Multiple specific subscribers
      const subscribersResult = await query(
        `SELECT * FROM newsletter_subscribers 
         WHERE id = ANY($1) AND is_active = true`,
        [subscriber_ids]
      );
      
      targetSubscribers = subscribersResult.rows;
      
    } else if (segment) {
      // Segment-based targeting
      let segmentQuery = '';
      let segmentParams = [];
      
      switch (segment) {
        case 'all':
          segmentQuery = 'SELECT * FROM newsletter_subscribers WHERE is_active = true AND is_confirmed = true';
          break;
          
        case 'active':
          segmentQuery = 'SELECT * FROM newsletter_subscribers WHERE is_active = true AND is_confirmed = true AND unsubscribed_at IS NULL';
          break;
          
        case 'new':
          segmentQuery = `SELECT * FROM newsletter_subscribers 
                         WHERE is_active = true AND is_confirmed = true 
                         AND subscription_date >= NOW() - INTERVAL '30 days'`;
          break;
          
        case 'high_engagement':
          segmentQuery = `SELECT ns.* FROM newsletter_subscribers ns
                         LEFT JOIN (
                           SELECT subscriber_id, 
                                  COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as sent_count,
                                  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened_count
                           FROM newsletter_analytics 
                           GROUP BY subscriber_id
                         ) analytics ON ns.id = analytics.subscriber_id
                         WHERE ns.is_active = true AND ns.is_confirmed = true
                         AND (analytics.sent_count = 0 OR (analytics.opened_count::float / analytics.sent_count::float) > 0.5)`;
          break;
          
        case 'low_engagement':
          segmentQuery = `SELECT ns.* FROM newsletter_subscribers ns
                         LEFT JOIN (
                           SELECT subscriber_id, 
                                  COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as sent_count,
                                  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened_count
                           FROM newsletter_analytics 
                           GROUP BY subscriber_id
                         ) analytics ON ns.id = analytics.subscriber_id
                         WHERE ns.is_active = true AND ns.is_confirmed = true
                         AND analytics.sent_count > 0 
                         AND (analytics.opened_count::float / analytics.sent_count::float) < 0.2`;
          break;
          
        default:
          return NextResponse.json(
            { error: 'Invalid segment specified' },
            { status: 400 }
          );
      }
      
      const segmentResult = await query(segmentQuery, segmentParams);
      targetSubscribers = segmentResult.rows;
      
    } else {
      return NextResponse.json(
        { error: 'Must specify subscriber_id, subscriber_ids, or segment' },
        { status: 400 }
      );
    }

    if (targetSubscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found for the specified criteria' },
        { status: 404 }
      );
    }

    // If scheduled, save as campaign
    if (schedule_at && !send_immediately) {
      const campaignResult = await query(
        `INSERT INTO newsletter_campaigns (
          title, subject, content, html_content, template_id, status, 
          scheduled_send_at, recipient_count, author, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        [
          `Targeted Campaign - ${subject}`,
          subject,
          content,
          html_content || null,
          template_id || null,
          new Date(schedule_at),
          targetSubscribers.length,
          session.user.email,
          session.user.id || null
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Campaign scheduled for ${targetSubscribers.length} subscribers`,
        campaign_id: campaignResult.rows[0].id,
        scheduled_at: schedule_at,
        recipient_count: targetSubscribers.length
      });
    }

    // Send immediately
    let sent_count = 0;
    let failed_count = 0;
    const failures = [];

    for (const subscriber of targetSubscribers) {
      try {
        // In a real implementation, you would integrate with an email service here
        // For now, we'll just log the analytics event
        
        // Create analytics record for sent email
        await query(
          `INSERT INTO newsletter_analytics 
           (subscriber_id, email, event_type, event_data, user_agent, ip_address, created_at)
           VALUES ($1, $2, 'sent', $3, $4, $5, CURRENT_TIMESTAMP)`,
          [
            subscriber.id,
            subscriber.email,
            JSON.stringify({
              subject,
              content_preview: content.substring(0, 100) + '...',
              template_id,
              sent_by: session.user.email,
              campaign_type: 'targeted',
              segment: segment || 'manual'
            }),
            'Admin Dashboard',
            'server'
          ]
        );

        sent_count++;
        
        // Simulate email sending delay (remove in production)
        // await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error);
        failed_count++;
        failures.push({
          email: subscriber.email,
          error: error.message
        });
      }
    }

    // Create campaign record for sent emails
    const campaignResult = await query(
      `INSERT INTO newsletter_campaigns (
        title, subject, content, html_content, template_id, status, 
        sent_at, recipient_count, author, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'sent', CURRENT_TIMESTAMP, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        `Targeted Campaign - ${subject}`,
        subject,
        content,
        html_content || null,
        template_id || null,
        sent_count,
        session.user.email,
        session.user.id || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Email sent to ${sent_count} subscribers`,
      campaign_id: campaignResult.rows[0].id,
      sent_count,
      failed_count,
      total_attempted: targetSubscribers.length,
      failures: failed_count > 0 ? failures : undefined
    });

  } catch (error) {
    console.error('Error sending targeted email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 