import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { sendConfirmation } from '@/lib/newsletter/delivery';

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, firstName, lastName, phone, company, interests, source, metadata } = body;
    
    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }
    
    const normalizedEmail = email.toLowerCase().trim();

    // Existing subscriber?
    const existingResult = await query(
      'SELECT id, is_active, is_confirmed, unsubscribed_at FROM newsletter_subscribers WHERE email = $1',
      [normalizedEmail]
    );

    let subscriberId: string;
    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.is_active && existing.is_confirmed) {
        return NextResponse.json({ error: 'This email is already subscribed' }, { status: 409 });
      }
      // Unconfirmed or previously unsubscribed: (re)start double opt-in.
      await query(
        `UPDATE newsletter_subscribers
            SET is_active = true, is_confirmed = false, unsubscribed_at = NULL, unsubscribe_reason = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [existing.id]
      );
      subscriberId = existing.id;
    } else {
      const result = await query(
        `INSERT INTO newsletter_subscribers
         (email, name, first_name, last_name, phone, company, interests,
          subscription_source, metadata, is_active, is_confirmed, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          normalizedEmail,
          name || null,
          firstName || null,
          lastName || null,
          phone || null,
          company || null,
          interests || null,
          source || 'website',
          metadata || {}
        ]
      );
      subscriberId = result.rows[0].id;
    }

    // Double opt-in: the subscription only becomes active for campaigns after the
    // subscriber clicks the emailed link. If the email cannot be sent, say so.
    const sent = await sendConfirmation(subscriberId);
    if (!sent.ok) {
      console.error('Newsletter confirmation email failed:', sent.error);
      return NextResponse.json(
        { error: 'We could not send the confirmation email right now. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      pendingConfirmation: true,
      message: 'Check your inbox and click the link to confirm your subscription.'
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}

// GET - Get subscribers (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const source = url.searchParams.get('source') || 'all';
    
    const offset = (page - 1) * limit;
    
    // Build query conditions
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      whereConditions.push(`(email ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status === 'active') {
      whereConditions.push('is_active = true');
    } else if (status === 'unsubscribed') {
      whereConditions.push('is_active = false');
    }
    
    if (source !== 'all') {
      whereConditions.push(`subscription_source = $${paramIndex}`);
      queryParams.push(source);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM newsletter_subscribers ${whereClause}`,
      queryParams
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Get subscribers
    const result = await query(
      `SELECT id, email, name, first_name, last_name, phone, company, interests, 
              subscription_source, subscription_date, is_active, unsubscribed_at, 
              unsubscribe_reason, created_at, updated_at
       FROM newsletter_subscribers ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );
    
    return NextResponse.json({
      subscribers: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { subscriberId, reason } = await request.json();
    
    if (!subscriberId) {
      return NextResponse.json(
        { error: 'Subscriber ID is required' },
        { status: 400 }
      );
    }
    
    await query(
      `UPDATE newsletter_subscribers 
       SET is_active = false, 
           unsubscribed_at = CURRENT_TIMESTAMP, 
           unsubscribe_reason = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason || 'Admin unsubscribe', subscriberId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe user' },
      { status: 500 }
    );
  }
}

