import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Fetch newsletter content (public access for display)
export async function GET() {
  try {
    const result = await query('SELECT * FROM newsletter_content ORDER BY created_at DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      // Return default content if none exists
      return NextResponse.json({
        title: 'Subscribe to the Newsletter',
        description: 'Get notified when I publish new articles and tutorials about web development.',
        incentive: '✨ Plus exclusive tips and early access to new content',
        subscriberCount: 127,
        footerText: 'By subscribing, you agree to receive our newsletter and promotional emails. You can unsubscribe at any time.',
        weeklyArticlesIcon: 'document',
        weeklyArticlesTitle: 'Weekly Articles',
        weeklyArticlesDescription: 'In-depth tutorials and insights',
        exclusiveTipsIcon: 'bolt',
        exclusiveTipsTitle: 'Exclusive Tips',
        exclusiveTipsDescription: 'Subscriber-only content and resources',
        earlyAccessIcon: 'clock',
        earlyAccessTitle: 'Early Access',
        earlyAccessDescription: 'Be first to see new projects and posts'
      });
    }

    // Convert snake_case to camelCase for frontend
    const data = result.rows[0];
    return NextResponse.json({
      title: data.title,
      description: data.description,
      incentive: data.incentive,
      subscriberCount: data.subscriber_count,
      footerText: data.footer_text,
      weeklyArticlesIcon: data.weekly_articles_icon,
      weeklyArticlesTitle: data.weekly_articles_title,
      weeklyArticlesDescription: data.weekly_articles_description,
      exclusiveTipsIcon: data.exclusive_tips_icon,
      exclusiveTipsTitle: data.exclusive_tips_title,
      exclusiveTipsDescription: data.exclusive_tips_description,
      earlyAccessIcon: data.early_access_icon,
      earlyAccessTitle: data.early_access_title,
      earlyAccessDescription: data.early_access_description
    });
  } catch (error) {
    console.error('Error fetching newsletter content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update newsletter content (requires admin authentication)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      incentive,
      subscriberCount,
      footerText,
      weeklyArticlesIcon,
      weeklyArticlesTitle,
      weeklyArticlesDescription,
      exclusiveTipsIcon,
      exclusiveTipsTitle,
      exclusiveTipsDescription,
      earlyAccessIcon,
      earlyAccessTitle,
      earlyAccessDescription
    } = body;

    // Check if content exists
    const existingResult = await query('SELECT id FROM newsletter_content ORDER BY created_at DESC LIMIT 1');
    
    if (existingResult.rows.length > 0) {
      // Update existing content
      const result = await query(
        `UPDATE newsletter_content 
         SET title = $1, description = $2, incentive = $3, subscriber_count = $4, 
             footer_text = $5, weekly_articles_icon = $6, weekly_articles_title = $7, 
             weekly_articles_description = $8, exclusive_tips_icon = $9, exclusive_tips_title = $10, 
             exclusive_tips_description = $11, early_access_icon = $12, early_access_title = $13, 
             early_access_description = $14, updated_at = CURRENT_TIMESTAMP
         WHERE id = $15
         RETURNING *`,
        [
          title, description, incentive, subscriberCount, footerText,
          weeklyArticlesIcon, weeklyArticlesTitle, weeklyArticlesDescription,
          exclusiveTipsIcon, exclusiveTipsTitle, exclusiveTipsDescription,
          earlyAccessIcon, earlyAccessTitle, earlyAccessDescription,
          existingResult.rows[0].id
        ]
      );
      
      // Convert snake_case to camelCase for response
      const data = result.rows[0];
      return NextResponse.json({
        title: data.title,
        description: data.description,
        incentive: data.incentive,
        subscriberCount: data.subscriber_count,
        footerText: data.footer_text,
        weeklyArticlesIcon: data.weekly_articles_icon,
        weeklyArticlesTitle: data.weekly_articles_title,
        weeklyArticlesDescription: data.weekly_articles_description,
        exclusiveTipsIcon: data.exclusive_tips_icon,
        exclusiveTipsTitle: data.exclusive_tips_title,
        exclusiveTipsDescription: data.exclusive_tips_description,
        earlyAccessIcon: data.early_access_icon,
        earlyAccessTitle: data.early_access_title,
        earlyAccessDescription: data.early_access_description
      });
    } else {
      // Create new content
      const result = await query(
        `INSERT INTO newsletter_content 
         (title, description, incentive, subscriber_count, footer_text, 
          weekly_articles_icon, weekly_articles_title, weekly_articles_description,
          exclusive_tips_icon, exclusive_tips_title, exclusive_tips_description,
          early_access_icon, early_access_title, early_access_description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          title, description, incentive, subscriberCount, footerText,
          weeklyArticlesIcon, weeklyArticlesTitle, weeklyArticlesDescription,
          exclusiveTipsIcon, exclusiveTipsTitle, exclusiveTipsDescription,
          earlyAccessIcon, earlyAccessTitle, earlyAccessDescription
        ]
      );
      
      // Convert snake_case to camelCase for response
      const data = result.rows[0];
      return NextResponse.json({
        title: data.title,
        description: data.description,
        incentive: data.incentive,
        subscriberCount: data.subscriber_count,
        footerText: data.footer_text,
        weeklyArticlesIcon: data.weekly_articles_icon,
        weeklyArticlesTitle: data.weekly_articles_title,
        weeklyArticlesDescription: data.weekly_articles_description,
        exclusiveTipsIcon: data.exclusive_tips_icon,
        exclusiveTipsTitle: data.exclusive_tips_title,
        exclusiveTipsDescription: data.exclusive_tips_description,
        earlyAccessIcon: data.early_access_icon,
        earlyAccessTitle: data.early_access_title,
        earlyAccessDescription: data.early_access_description
      });
    }
  } catch (error) {
    console.error('Error updating newsletter content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
