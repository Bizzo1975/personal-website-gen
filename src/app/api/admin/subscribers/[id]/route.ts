import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Get individual subscriber details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const subscriberId = params.id;

    // Get subscriber with analytics
    const subscriberResult = await query(
      `SELECT 
        ns.*,
        COALESCE(
          (SELECT COUNT(*) FROM newsletter_analytics WHERE subscriber_id = ns.id AND event_type = 'sent'),
          0
        ) as total_emails_sent,
        COALESCE(
          (SELECT COUNT(*) FROM newsletter_analytics WHERE subscriber_id = ns.id AND event_type = 'opened'),
          0
        ) as total_emails_opened,
        COALESCE(
          (SELECT COUNT(*) FROM newsletter_analytics WHERE subscriber_id = ns.id AND event_type = 'clicked'),
          0
        ) as total_clicks,
        COALESCE(
          (SELECT MAX(created_at) FROM newsletter_analytics WHERE subscriber_id = ns.id AND event_type = 'sent'),
          NULL
        ) as last_email_sent,
        COALESCE(
          (SELECT MAX(created_at) FROM newsletter_analytics WHERE subscriber_id = ns.id AND event_type = 'opened'),
          NULL
        ) as last_email_opened,
        COALESCE(
          (SELECT MAX(created_at) FROM newsletter_analytics WHERE subscriber_id = ns.id),
          NULL
        ) as last_activity
       FROM newsletter_subscribers ns
       WHERE ns.id = $1`,
      [subscriberId]
    );

    if (subscriberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    const subscriber = subscriberResult.rows[0];

    // Add calculated analytics
    subscriber.analytics = {
      total_emails_sent: parseInt(subscriber.total_emails_sent || 0),
      total_emails_opened: parseInt(subscriber.total_emails_opened || 0),
      total_clicks: parseInt(subscriber.total_clicks || 0),
      open_rate: subscriber.total_emails_sent > 0 
        ? (subscriber.total_emails_opened / subscriber.total_emails_sent) * 100 
        : 0,
      click_rate: subscriber.total_emails_sent > 0 
        ? (subscriber.total_clicks / subscriber.total_emails_sent) * 100 
        : 0,
      last_email_sent: subscriber.last_email_sent,
      last_email_opened: subscriber.last_email_opened,
      last_activity: subscriber.last_activity
    };

    // Get recent email activity
    const activityResult = await query(
      `SELECT event_type, event_data, created_at
       FROM newsletter_analytics
       WHERE subscriber_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [subscriberId]
    );

    subscriber.recent_activity = activityResult.rows;

    return NextResponse.json(subscriber);

  } catch (error) {
    console.error('Error fetching subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriber' },
      { status: 500 }
    );
  }
}

// PUT - Update subscriber
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const subscriberId = params.id;
    const body = await request.json();
    
    const {
      email,
      name,
      first_name,
      last_name,
      phone,
      company,
      interests,
      subscription_source,
      is_active,
      is_confirmed,
      preferences,
      metadata,
      gdpr_consent,
      tags
    } = body;

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Check if email already exists for another subscriber
    if (email) {
      const existingResult = await query(
        'SELECT id FROM newsletter_subscribers WHERE email = $1 AND id != $2',
        [email.toLowerCase().trim(), subscriberId]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists for another subscriber' },
          { status: 409 }
        );
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      updateValues.push(email.toLowerCase().trim());
      paramIndex++;
    }

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex}`);
      updateValues.push(first_name);
      paramIndex++;
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex}`);
      updateValues.push(last_name);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      updateValues.push(phone);
      paramIndex++;
    }

    if (company !== undefined) {
      updateFields.push(`company = $${paramIndex}`);
      updateValues.push(company);
      paramIndex++;
    }

    if (interests !== undefined) {
      updateFields.push(`interests = $${paramIndex}`);
      updateValues.push(interests);
      paramIndex++;
    }

    if (subscription_source !== undefined) {
      updateFields.push(`subscription_source = $${paramIndex}`);
      updateValues.push(subscription_source);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(is_active);
      paramIndex++;
    }

    if (is_confirmed !== undefined) {
      updateFields.push(`is_confirmed = $${paramIndex}`);
      updateValues.push(is_confirmed);
      paramIndex++;
    }

    if (preferences !== undefined) {
      updateFields.push(`preferences = $${paramIndex}`);
      updateValues.push(JSON.stringify(preferences));
      paramIndex++;
    }

    if (metadata !== undefined) {
      updateFields.push(`metadata = $${paramIndex}`);
      updateValues.push(JSON.stringify(metadata));
      paramIndex++;
    }

    if (gdpr_consent !== undefined) {
      updateFields.push(`gdpr_consent = $${paramIndex}`);
      updateValues.push(gdpr_consent);
      paramIndex++;
      
      if (gdpr_consent) {
        updateFields.push(`gdpr_consent_date = $${paramIndex}`);
        updateValues.push(new Date());
        paramIndex++;
      }
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) { // Only updated_at was added
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add subscriber ID as the last parameter
    updateValues.push(subscriberId);

    const result = await query(
      `UPDATE newsletter_subscribers 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscriber: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to update subscriber' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subscriber (with GDPR compliance)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const subscriberId = params.id;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Permanent deletion - remove all traces (GDPR right to be forgotten)
      
      // Delete analytics data first
      await query(
        'DELETE FROM newsletter_analytics WHERE subscriber_id = $1',
        [subscriberId]
      );

      // Delete the subscriber
      const result = await query(
        'DELETE FROM newsletter_subscribers WHERE id = $1 RETURNING email',
        [subscriberId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Subscriber permanently deleted',
        email: result.rows[0].email
      });

    } else {
      // Soft deletion - mark as unsubscribed
      const result = await query(
        `UPDATE newsletter_subscribers 
         SET is_active = false, 
             unsubscribed_at = CURRENT_TIMESTAMP,
             unsubscribe_reason = 'Deleted by admin',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 
         RETURNING *`,
        [subscriberId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Subscriber unsubscribed',
        subscriber: result.rows[0]
      });
    }

  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscriber' },
      { status: 500 }
    );
  }
} 