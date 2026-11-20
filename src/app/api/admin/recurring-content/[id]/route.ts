import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { validateRule } from '@/lib/recurring/rules';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = resolvedParams;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = resolvedParams;
    const body = await request.json().catch(() => ({}));

    const existingRule = await query(
      `SELECT name, content_type, template_content_id, recurrence_pattern, recurrence_day,
              to_char(recurrence_time, 'HH24:MI') AS recurrence_time, time_zone, is_active
         FROM recurring_content_rules WHERE id = $1`,
      [id]
    );

    if (existingRule.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recurring content rule not found' },
        { status: 404 }
      );
    }

    // W26: fields not sent keep their values (Sunday = 0 is a real value, not "missing");
    // the next run is recomputed from the saved settings in the rule's time zone.
    const checked = await validateRule(body, existingRule.rows[0]);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    const v = checked.values;

    const result = await query(
      `UPDATE recurring_content_rules 
       SET name = $1, content_type = $2, template_content_id = $3, recurrence_pattern = $4,
           recurrence_day = $5, recurrence_time = $6, time_zone = $7, is_active = $8,
           next_scheduled_at = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [v.name, v.contentType, v.templateContentId, v.pattern, v.day, v.time, v.timeZone, v.isActive,
       v.nextScheduledAt, id]
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = resolvedParams;

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

    // Content the rule created keeps existing; it just stops pointing at the rule
    // (otherwise the foreign keys make this delete fail once the rule has run).
    await query(
      `WITH p AS (UPDATE posts SET recurring_rule_id = NULL WHERE recurring_rule_id = $1),
            j AS (UPDATE projects SET recurring_rule_id = NULL WHERE recurring_rule_id = $1),
            n AS (UPDATE newsletter_campaigns SET recurring_rule_id = NULL WHERE recurring_rule_id = $1)
       DELETE FROM recurring_content_rules WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ message: 'Recurring content rule deleted successfully' });

  } catch (error) {
    console.error('Recurring content DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring content rule' },
      { status: 500 }
    );
  }
}

// (W26: next-run dates are computed by lib/recurring/schedule.ts in the rule's time zone.)