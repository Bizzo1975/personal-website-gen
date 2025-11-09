import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let sql = `
      SELECT 
        r.*,
        CASE 
          WHEN r.content_type = 'post' THEN p.title
          WHEN r.content_type = 'project' THEN pr.title
          WHEN r.content_type = 'newsletter' THEN n.title
        END as template_title
      FROM recurring_content_rules r
      LEFT JOIN posts p ON r.template_content_id = p.id AND r.content_type = 'post'
      LEFT JOIN projects pr ON r.template_content_id = pr.id AND r.content_type = 'project'
      LEFT JOIN newsletter_campaigns n ON r.template_content_id = n.id AND r.content_type = 'newsletter'
    `;

    const params: any[] = [];
    if (activeOnly) {
      sql += ' WHERE r.is_active = true';
    }

    sql += ' ORDER BY r.created_at DESC';

    const result = await query(sql, params);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Recurring content GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring content rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      contentType,
      templateContentId,
      recurrencePattern,
      recurrenceDay,
      recurrenceTime,
      targetAccessLevels,
      permissions
    } = await request.json();

    // Validate required fields
    if (!name || !contentType || !recurrencePattern || !recurrenceTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!['post', 'project', 'newsletter'].includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Validate recurrence pattern
    if (!['weekly', 'monthly'].includes(recurrencePattern)) {
      return NextResponse.json(
        { error: 'Invalid recurrence pattern' },
        { status: 400 }
      );
    }

    // Calculate next scheduled date
    const nextScheduledAt = calculateNextScheduledDate(
      recurrencePattern,
      recurrenceDay,
      recurrenceTime
    );

    const result = await query(
      `INSERT INTO recurring_content_rules (
        name, content_type, template_content_id, recurrence_pattern, 
        recurrence_day, recurrence_time, target_access_levels, permissions,
        next_scheduled_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name,
        contentType,
        templateContentId,
        recurrencePattern,
        recurrenceDay,
        recurrenceTime,
        targetAccessLevels || ['all'],
        permissions || { level: 'all' },
        nextScheduledAt,
        session.user.id
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error('Recurring content POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring content rule' },
      { status: 500 }
    );
  }
}

function calculateNextScheduledDate(
  pattern: string,
  day: number,
  time: string
): Date {
  const now = new Date();
  let nextDate = new Date();

  if (pattern === 'weekly') {
    // day is 0-6 (Sunday-Saturday)
    const currentDay = now.getDay();
    const daysUntilNext = (day - currentDay + 7) % 7;
    nextDate.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
  } else if (pattern === 'monthly') {
    // day is 1-31 (day of month)
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    nextDate = new Date(currentYear, currentMonth, day);
    
    // If the day has already passed this month, move to next month
    if (nextDate <= now) {
      nextDate = new Date(currentYear, currentMonth + 1, day);
    }
  }

  // Set the time
  const [hours, minutes] = time.split(':');
  nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return nextDate;
} 