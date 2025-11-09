import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// Enhanced subscriber interface matching the frontend
interface SubscriberData {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  interests: string[];
  subscription_source: string;
  subscription_date: string;
  is_active: boolean;
  is_confirmed: boolean;
  unsubscribed_at?: string;
  unsubscribe_reason?: string;
  preferences: any;
  metadata: any;
  gdpr_consent: boolean;
  gdpr_consent_date?: string;
  data_retention_date?: string;
  created_at: string;
  updated_at: string;
}

// GET - Fetch subscribers with advanced filtering and analytics
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const source = searchParams.get('source') || '';
    const dateRange = searchParams.get('date_range') || '30d';
    const gdprConsent = searchParams.get('gdpr_consent') || 'all';
    const engagement = searchParams.get('engagement') || 'all';
    const location = searchParams.get('location') || '';

    // Build WHERE clause
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      whereConditions.push(`(
        LOWER(email) LIKE $${paramIndex} OR 
        LOWER(name) LIKE $${paramIndex} OR 
        LOWER(first_name) LIKE $${paramIndex} OR 
        LOWER(last_name) LIKE $${paramIndex} OR 
        LOWER(company) LIKE $${paramIndex}
      )`);
      queryParams.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    // Status filter
    if (status !== 'all') {
      switch (status) {
        case 'active':
          whereConditions.push(`is_active = true AND is_confirmed = true AND unsubscribed_at IS NULL`);
          break;
        case 'inactive':
          whereConditions.push(`is_active = false`);
          break;
        case 'pending':
          whereConditions.push(`is_confirmed = false`);
          break;
        case 'unsubscribed':
          whereConditions.push(`unsubscribed_at IS NOT NULL`);
          break;
      }
    }

    // Source filter
    if (source) {
      whereConditions.push(`subscription_source = $${paramIndex}`);
      queryParams.push(source);
      paramIndex++;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const daysAgo = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[dateRange] || 30;
      
      whereConditions.push(`subscription_date >= NOW() - INTERVAL '${daysAgo} days'`);
    }

    // GDPR consent filter
    if (gdprConsent !== 'all') {
      switch (gdprConsent) {
        case 'consented':
          whereConditions.push(`gdpr_consent = true`);
          break;
        case 'pending':
          whereConditions.push(`gdpr_consent = false`);
          break;
        case 'expired':
          whereConditions.push(`data_retention_date < NOW()`);
          break;
      }
    }

    // Location filter
    if (location) {
      whereConditions.push(`metadata->>'location'->>'country' = $${paramIndex}`);
      queryParams.push(location);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM newsletter_subscribers ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get subscribers with analytics
    const subscribersResult = await query(
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
       ${whereClause}
       ORDER BY ns.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Calculate engagement metrics for each subscriber
    const subscribers = subscribersResult.rows.map(subscriber => ({
      ...subscriber,
      analytics: {
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
      }
    }));

    return NextResponse.json({
      subscribers,
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

// POST - Add new subscriber
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
      email, 
      name, 
      first_name, 
      last_name, 
      phone, 
      company, 
      interests, 
      subscription_source, 
      preferences, 
      metadata, 
      gdpr_consent 
    } = body;

    // Validate required fields
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Check if subscriber already exists
    const existingResult = await query(
      'SELECT id FROM newsletter_subscribers WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Subscriber already exists' },
        { status: 409 }
      );
    }

    // Create new subscriber
    const result = await query(
      `INSERT INTO newsletter_subscribers (
        email, name, first_name, last_name, phone, company, interests, 
        subscription_source, preferences, metadata, gdpr_consent, gdpr_consent_date,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        email.toLowerCase().trim(),
        name,
        first_name,
        last_name,
        phone,
        company,
        interests || [],
        subscription_source || 'admin',
        preferences || {},
        metadata || {},
        gdpr_consent || false,
        gdpr_consent ? new Date() : null
      ]
    );

    return NextResponse.json({
      success: true,
      subscriber: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to create subscriber' },
      { status: 500 }
    );
  }
} 