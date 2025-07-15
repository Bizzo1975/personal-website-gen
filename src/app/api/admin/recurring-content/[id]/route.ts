import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const result = await query(
      `SELECT 
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
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recurring content rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Recurring content GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring content rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const {
      name,
      contentType,
      templateContentId,
      recurrencePattern,
      recurrenceDay,
      recurrenceTime,
      targetAccessLevels,
      permissions,
      isActive
    } = await request.json();

    // Check if rule exists
    const existingRule = await query(
      'SELECT * FROM recurring_content_rules WHERE id = $1',
      [id]
    );

    if (existingRule.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recurring content rule not found' },
        { status: 404 }
      );
    }

    // Calculate next scheduled date if pattern changed
    let nextScheduledAt = existingRule.rows[0].next_scheduled_at;
    if (recurrencePattern || recurrenceDay || recurrenceTime) {
      nextScheduledAt = calculateNextScheduledDate(
        recurrencePattern || existingRule.rows[0].recurrence_pattern,
        recurrenceDay || existingRule.rows[0].recurrence_day,
        recurrenceTime || existingRule.rows[0].recurrence_time
      );
    }

    const result = await query(
      `UPDATE recurring_content_rules 
       SET name = COALESCE($1, name),
           content_type = COALESCE($2, content_type),
           template_content_id = COALESCE($3, template_content_id),
           recurrence_pattern = COALESCE($4, recurrence_pattern),
           recurrence_day = COALESCE($5, recurrence_day),
           recurrence_time = COALESCE($6, recurrence_time),
           target_access_levels = COALESCE($7, target_access_levels),
           permissions = COALESCE($8, permissions),
           is_active = COALESCE($9, is_active),
           next_scheduled_at = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [
        name,
        contentType,
        templateContentId,
        recurrencePattern,
        recurrenceDay,
        recurrenceTime,
        targetAccessLevels,
        permissions,
        isActive,
        nextScheduledAt,
        id
      ]
    );

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Recurring content PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring content rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if rule exists
    const existingRule = await query(
      'SELECT * FROM recurring_content_rules WHERE id = $1',
      [id]
    );

    if (existingRule.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recurring content rule not found' },
        { status: 404 }
      );
    }

    // Delete the rule
    await query('DELETE FROM recurring_content_rules WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Recurring content rule deleted successfully' });

  } catch (error) {
    console.error('Recurring content DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring content rule' },
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