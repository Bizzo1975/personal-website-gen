import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

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

    if (!id) {
      return NextResponse.json(
        { error: 'Missing content ID' },
        { status: 400 }
      );
    }

    // First, check if the content exists and is in scheduled status
    const [postResult, projectResult] = await Promise.all([
      query('SELECT id, title, status FROM posts WHERE id = $1', [id]),
      query('SELECT id, title, status FROM projects WHERE id = $1', [id])
    ]);

    let contentType: 'post' | 'project' | null = null;
    let contentTitle = '';

    if (postResult.rows.length > 0) {
      const post = postResult.rows[0];
      if (post.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Only scheduled content can be unscheduled' },
          { status: 400 }
        );
      }
      contentType = 'post';
      contentTitle = post.title;
    } else if (projectResult.rows.length > 0) {
      const project = projectResult.rows[0];
      if (project.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Only scheduled content can be unscheduled' },
          { status: 400 }
        );
      }
      contentType = 'project';
      contentTitle = project.title;
    } else {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Update the content status back to 'draft' and clear the scheduled_publish_at date
    if (contentType === 'post') {
      await query(
        'UPDATE posts SET status = $1, scheduled_publish_at = NULL WHERE id = $2',
        ['draft', id]
      );
    } else {
      await query(
        'UPDATE projects SET status = $1, scheduled_publish_at = NULL WHERE id = $2',
        ['draft', id]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${contentTitle} unscheduled successfully`
    });

  } catch (error) {
    console.error('Unschedule content API error:', error);
    return NextResponse.json(
      { error: 'Failed to unschedule content' },
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
    const { scheduledDate } = await request.json();

    if (!id || !scheduledDate) {
      return NextResponse.json(
        { error: 'Missing required fields: id and scheduledDate' },
        { status: 400 }
      );
    }

    // Validate the scheduled date is in the future
    const scheduleTime = new Date(scheduledDate);
    if (scheduleTime <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled date must be in the future' },
        { status: 400 }
      );
    }

    // First, check if the content exists and is in scheduled status
    const [postResult, projectResult] = await Promise.all([
      query('SELECT id, title, status FROM posts WHERE id = $1', [id]),
      query('SELECT id, title, status FROM projects WHERE id = $1', [id])
    ]);

    let contentType: 'post' | 'project' | null = null;
    let contentTitle = '';

    if (postResult.rows.length > 0) {
      const post = postResult.rows[0];
      if (post.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Only scheduled content can be rescheduled' },
          { status: 400 }
        );
      }
      contentType = 'post';
      contentTitle = post.title;
    } else if (projectResult.rows.length > 0) {
      const project = projectResult.rows[0];
      if (project.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Only scheduled content can be rescheduled' },
          { status: 400 }
        );
      }
      contentType = 'project';
      contentTitle = project.title;
    } else {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Update the scheduled_publish_at date
    if (contentType === 'post') {
      await query(
        'UPDATE posts SET scheduled_publish_at = $1 WHERE id = $2',
        [scheduleTime, id]
      );
    } else {
      await query(
        'UPDATE projects SET scheduled_publish_at = $1 WHERE id = $2',
        [scheduleTime, id]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${contentTitle} rescheduled for ${scheduleTime.toLocaleDateString()}`
    });

  } catch (error) {
    console.error('Reschedule content API error:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule content' },
      { status: 500 }
    );
  }
} 