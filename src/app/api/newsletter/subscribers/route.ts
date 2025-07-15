import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

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
    
    // Check if subscriber already exists
    const existingResult = await query(
      'SELECT id, is_active, unsubscribed_at FROM newsletter_subscribers WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    
    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      
      if (existing.is_active) {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 409 }
        );
      } else {
        // Reactivate previously unsubscribed user
        await query(
          `UPDATE newsletter_subscribers 
           SET is_active = true, 
               unsubscribed_at = NULL, 
               unsubscribe_reason = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [existing.id]
        );
        
        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          subscriber: { email, reactivated: true }
        });
      }
    }
    
    // Create new subscriber
    const result = await query(
      `INSERT INTO newsletter_subscribers 
       (email, name, first_name, last_name, phone, company, interests, 
        subscription_source, metadata, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, name, created_at`,
      [
        email.toLowerCase().trim(),
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
    
    const subscriber = result.rows[0];
    
    // Send welcome email (if enabled)
    try {
      await sendWelcomeEmail(subscriber);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.created_at
      }
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
    let queryParams = [];
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

// Helper function to send welcome email
async function sendWelcomeEmail(subscriber: any) {
  // Get welcome template
  const templateResult = await query(
    'SELECT * FROM newsletter_templates WHERE type = $1 AND is_active = true LIMIT 1',
    ['welcome']
  );
  
  if (templateResult.rows.length === 0) {
    console.log('No welcome template found');
    return;
  }
  
  const template = templateResult.rows[0];
  
  // TODO: Implement actual email sending with SendGrid
  // For now, we'll just log it
  console.log('Welcome email would be sent to:', subscriber.email);
  console.log('Template:', template.name);
  
  // In a real implementation, you would:
  // 1. Process template variables
  // 2. Send via SendGrid API
  // 3. Log the email in newsletter_analytics
} 