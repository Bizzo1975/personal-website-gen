import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

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
          { error: 'Only scheduled content can be published immediately' },
          { status: 400 }
        );
      }
      contentType = 'post';
      contentTitle = post.title;
    } else if (projectResult.rows.length > 0) {
      const project = projectResult.rows[0];
      if (project.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Only scheduled content can be published immediately' },
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

    // Update the content status to 'published' and set the published_at date
    const publishTime = new Date();
    
    if (contentType === 'post') {
      await query(
        'UPDATE posts SET status = $1, published_at = $2, published = true WHERE id = $3',
        ['published', publishTime, id]
      );
    } else {
      await query(
        'UPDATE projects SET status = $1, published_at = $2 WHERE id = $3',
        ['published', publishTime, id]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${contentTitle} published successfully`
    });

  } catch (error) {
    console.error('Publish now API error:', error);
    return NextResponse.json(
      { error: 'Failed to publish content' },
      { status: 500 }
    );
  }
} 