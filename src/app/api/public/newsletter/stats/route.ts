import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Public API endpoint to get newsletter subscriber count
 * No authentication required - safe for public use
 */
export async function GET() {
  try {
    // Query the database for active subscriber count only
    const result = await query(
      'SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = true'
    );

    const activeSubscribers = parseInt(result.rows[0].count || '0');

    // Return only the public-safe information
    return NextResponse.json({
      totalSubscribers: activeSubscribers,
      success: true
    });
  } catch (error) {
    console.error('Public newsletter stats API error:', error);
    
    // Return 0 on error so the UI doesn't break
    return NextResponse.json({
      totalSubscribers: 0,
      success: false
    });
  }
}

