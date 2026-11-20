import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Public subscriber count. Counts only confirmed, active subscribers (double opt-in).
 * On a database error it returns 503 instead of a fake 0.
 */
export async function GET() {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM newsletter_subscribers
        WHERE is_active = true AND is_confirmed = true AND unsubscribed_at IS NULL`
    );
    return NextResponse.json({
      totalSubscribers: parseInt(result.rows[0].count || '0'),
      success: true
    });
  } catch (error) {
    console.error('Public newsletter stats API error:', error);
    return NextResponse.json({ success: false, error: 'Subscriber count unavailable' }, { status: 503 });
  }
}
