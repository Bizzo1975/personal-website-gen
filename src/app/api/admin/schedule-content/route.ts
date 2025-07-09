import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId, scheduledDate } = await request.json();

    if (!contentId || !scheduledDate) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId and scheduledDate' },
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

    // First, check if the content exists and is in draft status
    const [postResult, projectResult] = await Promise.all([
      query('SELECT id, title, status FROM posts WHERE id = $1', [contentId]),
      query('SELECT id, title, status FROM projects WHERE id = $1', [contentId])
    ]);

    let contentType: 'post' | 'project' | null = null;
    let contentTitle = '';

    if (postResult.rows.length > 0) {
      const post = postResult.rows[0];
      if (post.status !== 'draft') {
        return NextResponse.json(
          { error: 'Only draft content can be scheduled' },
          { status: 400 }
        );
      }
      contentType = 'post';
      contentTitle = post.title;
    } else if (projectResult.rows.length > 0) {
      const project = projectResult.rows[0];
      if (project.status !== 'draft') {
        return NextResponse.json(
          { error: 'Only draft content can be scheduled' },
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

    // Update the content status to 'scheduled' and set the scheduled_publish_at date
    if (contentType === 'post') {
      await query(
        'UPDATE posts SET status = $1, scheduled_publish_at = $2 WHERE id = $3',
        ['scheduled', scheduleTime, contentId]
      );
    } else {
      await query(
        'UPDATE projects SET status = $1, scheduled_publish_at = $2 WHERE id = $3',
        ['scheduled', scheduleTime, contentId]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${contentTitle} scheduled for publication on ${scheduleTime.toLocaleDateString()}`
    });

  } catch (error) {
    console.error('Schedule content API error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule content' },
      { status: 500 }
    );
  }
} 