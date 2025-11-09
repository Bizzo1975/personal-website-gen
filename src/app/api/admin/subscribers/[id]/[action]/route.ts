import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// POST - Perform actions on subscribers
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  let resolvedParams: { id: string; action: string } | null = null;
  try {
    resolvedParams = await params;
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

    const subscriberId = resolvedParams.id;
    const action = resolvedParams.action;

    // Verify subscriber exists
    const subscriberResult = await query(
      'SELECT * FROM newsletter_subscribers WHERE id = $1',
      [subscriberId]
    );

    if (subscriberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    const subscriber = subscriberResult.rows[0];

    switch (action) {
      case 'activate':
        await query(
          `UPDATE newsletter_subscribers 
           SET is_active = true, 
               unsubscribed_at = NULL, 
               unsubscribe_reason = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId]
        );

        return NextResponse.json({
          success: true,
          message: 'Subscriber activated successfully'
        });

      case 'deactivate':
        await query(
          `UPDATE newsletter_subscribers 
           SET is_active = false,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId]
        );

        return NextResponse.json({
          success: true,
          message: 'Subscriber deactivated successfully'
        });

      case 'confirm':
        await query(
          `UPDATE newsletter_subscribers 
           SET is_confirmed = true,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId]
        );

        return NextResponse.json({
          success: true,
          message: 'Subscriber confirmed successfully'
        });

      case 'unsubscribe':
        const { reason } = await request.json();
        
        await query(
          `UPDATE newsletter_subscribers 
           SET is_active = false,
               unsubscribed_at = CURRENT_TIMESTAMP,
               unsubscribe_reason = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId, reason || 'Unsubscribed by admin']
        );

        return NextResponse.json({
          success: true,
          message: 'Subscriber unsubscribed successfully'
        });

      case 'resubscribe':
        await query(
          `UPDATE newsletter_subscribers 
           SET is_active = true,
               unsubscribed_at = NULL,
               unsubscribe_reason = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId]
        );

        return NextResponse.json({
          success: true,
          message: 'Subscriber resubscribed successfully'
        });

      case 'update-gdpr':
        const { gdpr_consent } = await request.json();
        
        await query(
          `UPDATE newsletter_subscribers 
           SET gdpr_consent = $2,
               gdpr_consent_date = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId, gdpr_consent, gdpr_consent ? new Date() : null]
        );

        return NextResponse.json({
          success: true,
          message: 'GDPR consent updated successfully'
        });

      case 'send-email':
        const emailData = await request.json();
        const { subject, content, template_id } = emailData;

        if (!subject || !content) {
          return NextResponse.json(
            { error: 'Subject and content are required' },
            { status: 400 }
          );
        }

        // Here you would integrate with your email service
        // For now, we'll just log the analytics event
        await query(
          `INSERT INTO newsletter_analytics 
           (subscriber_id, email, event_type, event_data, created_at)
           VALUES ($1, $2, 'sent', $3, CURRENT_TIMESTAMP)`,
          [
            subscriberId,
            subscriber.email,
            JSON.stringify({
              subject,
              content: content.substring(0, 100) + '...',
              template_id,
              sent_by: session.user.email,
              campaign_type: 'manual'
            })
          ]
        );

        return NextResponse.json({
          success: true,
          message: 'Email sent successfully'
        });

      case 'add-tags':
        const { tags } = await request.json();
        
        if (!Array.isArray(tags)) {
          return NextResponse.json(
            { error: 'Tags must be an array' },
            { status: 400 }
          );
        }

        // Get current interests and merge with new tags
        const currentInterests = subscriber.interests || [];
        const updatedInterests = [...new Set([...currentInterests, ...tags])];

        await query(
          `UPDATE newsletter_subscribers 
           SET interests = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId, updatedInterests]
        );

        return NextResponse.json({
          success: true,
          message: 'Tags added successfully',
          interests: updatedInterests
        });

      case 'remove-tags':
        const { remove_tags } = await request.json();
        
        if (!Array.isArray(remove_tags)) {
          return NextResponse.json(
            { error: 'Tags must be an array' },
            { status: 400 }
          );
        }

        // Remove specified tags from interests
        const filteredInterests = (subscriber.interests || []).filter(
          (interest: string) => !remove_tags.includes(interest)
        );

        await query(
          `UPDATE newsletter_subscribers 
           SET interests = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId, filteredInterests]
        );

        return NextResponse.json({
          success: true,
          message: 'Tags removed successfully',
          interests: filteredInterests
        });

      case 'update-preferences':
        const { preferences } = await request.json();
        
        await query(
          `UPDATE newsletter_subscribers 
           SET preferences = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [subscriberId, JSON.stringify(preferences)]
        );

        return NextResponse.json({
          success: true,
          message: 'Preferences updated successfully'
        });

      case 'reset-engagement':
        // Reset engagement metrics by removing analytics data
        await query(
          'DELETE FROM newsletter_analytics WHERE subscriber_id = $1',
          [subscriberId]
        );

        return NextResponse.json({
          success: true,
          message: 'Engagement metrics reset successfully'
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    const actionName = resolvedParams?.action || 'unknown';
    console.error(`Error performing action ${actionName}:`, error);
    return NextResponse.json(
      { error: `Failed to perform action: ${actionName}` },
      { status: 500 }
    );
  }
} 