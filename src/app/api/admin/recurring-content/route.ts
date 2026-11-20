import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { validateRule } from '@/lib/recurring/rules';

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

    const body = await request.json().catch(() => ({}));
    // W26: validated in one place; times are in the rule's time zone (sent by the browser).
    const checked = await validateRule(body);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    const v = checked.values;

    const result = await query(
      `INSERT INTO recurring_content_rules (
        name, content_type, template_content_id, recurrence_pattern,
        recurrence_day, recurrence_time, time_zone, is_active,
        next_scheduled_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [v.name, v.contentType, v.templateContentId, v.pattern, v.day, v.time, v.timeZone, v.isActive,
       v.nextScheduledAt, session.user.id || null]
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