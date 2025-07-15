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

    // Get all scheduled content from PostgreSQL
    const [postsResult, projectsResult, newslettersResult] = await Promise.all([
      query(`
        SELECT id, title, slug, scheduled_publish_at as scheduledDate, status, 
               permission_level, excerpt, 'post' as type
        FROM posts 
        WHERE status = 'scheduled' 
        ORDER BY scheduled_publish_at ASC
      `),
      query(`
        SELECT id, title, slug, scheduled_publish_at as scheduledDate, status, 
               permission_level, description as excerpt, 'project' as type
        FROM projects 
        WHERE status = 'scheduled' 
        ORDER BY scheduled_publish_at ASC
      `),
      query(`
        SELECT id, title, subject as slug, scheduled_send_at as scheduledDate, status, 
               target_access_levels as permission_level, content as excerpt, 'newsletter' as type
        FROM newsletter_campaigns 
        WHERE status = 'scheduled' 
        ORDER BY scheduled_send_at ASC
      `)
    ]);

    // Combine all scheduled content
    const scheduledContent = [
      ...postsResult.rows.map(row => ({
        ...row,
        scheduledDate: row.scheduleddate, // PostgreSQL returns lowercase field names
        author: 'Admin User', // You could join with users table to get actual author
        excerpt: row.excerpt || `${row.title} scheduled for publication`,
        recurringRuleId: null, // No recurring functionality implemented yet
        isRecurring: false
      })),
      ...projectsResult.rows.map(row => ({
        ...row,
        scheduledDate: row.scheduleddate,
        author: 'Admin User',
        excerpt: row.excerpt || `${row.title} project scheduled for publication`,
        recurringRuleId: null, // No recurring functionality implemented yet
        isRecurring: false
      })),
      ...newslettersResult.rows.map(row => ({
        ...row,
        scheduledDate: row.scheduleddate,
        author: 'Admin User',
        excerpt: `Newsletter: ${row.title}`,
        recurringRuleId: null, // No recurring functionality implemented yet
        isRecurring: false
      }))
    ];

    // Sort by scheduled date
    scheduledContent.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    return NextResponse.json(scheduledContent);

  } catch (error) {
    console.error('Scheduled content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled content' },
      { status: 500 }
    );
  }
} 

