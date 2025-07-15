import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get newsletter content from database
    const result = await query(
      'SELECT * FROM newsletter_content ORDER BY created_at DESC LIMIT 1'
    );
    
    const content = result.rows[0] || {};
    
    const response = {
      title: content.title || 'Stay in the Loop',
      description: content.description || 'Get notified about new projects, blog posts, and insights on modern web development.',
      incentive: content.incentive || '🚀 Plus exclusive tips, early access to new content, and behind-the-scenes updates',
      footerText: content.footer_text || 'By subscribing, you agree to receive our newsletter and promotional emails.',
      weeklyArticlesTitle: content.weekly_articles_title || 'Weekly Articles',
      weeklyArticlesDescription: content.weekly_articles_description || 'In-depth tutorials and insights',
      exclusiveTipsTitle: content.exclusive_tips_title || 'Exclusive Tips',
      exclusiveTipsDescription: content.exclusive_tips_description || 'Subscriber-only content and resources',
      earlyAccessTitle: content.early_access_title || 'Early Access',
      earlyAccessDescription: content.early_access_description || 'Be first to see new projects and posts'
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching newsletter content:', error);
    return NextResponse.json({ error: 'Failed to fetch newsletter content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const updatedContent = await request.json();
    
    // Update or insert newsletter content
    const result = await query(
      'SELECT id FROM newsletter_content LIMIT 1'
    );
    
    if (result.rows.length > 0) {
      // Update existing
      await query(
        `UPDATE newsletter_content SET 
         title = $1, 
         description = $2, 
         incentive = $3, 
         footer_text = $4,
         weekly_articles_title = $5,
         weekly_articles_description = $6,
         exclusive_tips_title = $7,
         exclusive_tips_description = $8,
         early_access_title = $9,
         early_access_description = $10,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $11`,
        [
          updatedContent.title,
          updatedContent.description,
          updatedContent.incentive,
          updatedContent.footerText,
          updatedContent.weeklyArticlesTitle,
          updatedContent.weeklyArticlesDescription,
          updatedContent.exclusiveTipsTitle,
          updatedContent.exclusiveTipsDescription,
          updatedContent.earlyAccessTitle,
          updatedContent.earlyAccessDescription,
          result.rows[0].id
        ]
      );
    } else {
      // Insert new
      await query(
        `INSERT INTO newsletter_content (
          title, description, incentive, footer_text,
          weekly_articles_title, weekly_articles_description,
          exclusive_tips_title, exclusive_tips_description,
          early_access_title, early_access_description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          updatedContent.title,
          updatedContent.description,
          updatedContent.incentive,
          updatedContent.footerText,
          updatedContent.weeklyArticlesTitle,
          updatedContent.weeklyArticlesDescription,
          updatedContent.exclusiveTipsTitle,
          updatedContent.exclusiveTipsDescription,
          updatedContent.earlyAccessTitle,
          updatedContent.earlyAccessDescription
        ]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating newsletter content:', error);
    return NextResponse.json({ error: 'Failed to update newsletter content' }, { status: 500 });
  }
} 
