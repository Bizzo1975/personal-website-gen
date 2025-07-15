import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Get automation rules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const result = await query(
      `SELECT id, name, description, type, is_active, trigger_conditions, 
              schedule_config, target_criteria, last_run_at, next_run_at, 
              created_at, updated_at
       FROM newsletter_automation_rules
       ORDER BY created_at DESC`
    );
    
    return NextResponse.json({
      rules: result.rows
    });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

// POST - Generate automated newsletter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { type = 'monthly_digest', forceGenerate = false } = body;
    
    if (type === 'monthly_digest') {
      return await generateMonthlyDigest(forceGenerate);
    }
    
    return NextResponse.json(
      { error: 'Invalid automation type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error generating automated newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to generate automated newsletter' },
      { status: 500 }
    );
  }
}

async function generateMonthlyDigest(forceGenerate: boolean = false) {
  try {
    // Check if we already generated this month's digest
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const existingDigest = await query(
      `SELECT id FROM newsletter_campaigns 
       WHERE type = 'automated' 
       AND title LIKE $1 
       AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [`%${currentMonth}%`]
    );
    
    if (existingDigest.rows.length > 0 && !forceGenerate) {
      return NextResponse.json({
        success: false,
        message: 'Monthly digest already generated for this month',
        existingCampaignId: existingDigest.rows[0].id
      });
    }
    
    // Get recent published posts (last 30 days)
    const recentPosts = await query(
      `SELECT id, title, slug, excerpt, featured_image, date, read_time
       FROM posts 
       WHERE published = true 
         AND status = 'published'
         AND date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY date DESC 
       LIMIT 5`
    );
    
    // Get recent published projects (last 30 days)
    const recentProjects = await query(
      `SELECT id, title, slug, description, image, technologies
       FROM projects 
       WHERE status = 'published'
         AND published_at >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY published_at DESC 
       LIMIT 3`
    );
    
    // Check if we have enough content
    if (recentPosts.rows.length === 0 && recentProjects.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No recent content found to include in monthly digest'
      });
    }
    
    // Get the monthly digest template
    const templateResult = await query(
      `SELECT * FROM newsletter_templates 
       WHERE type = 'monthly_digest' 
         AND is_active = true 
       ORDER BY is_system DESC, created_at DESC 
       LIMIT 1`
    );
    
    if (templateResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No monthly digest template found'
      });
    }
    
    const template = templateResult.rows[0];
    
    // Generate content
    const currentDate = new Date();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const year = currentDate.getFullYear();
    
    const title = `Monthly Newsletter - ${monthName} ${year}`;
    const subject = `Monthly Newsletter - ${monthName} ${year}`;
    const slug = `monthly-newsletter-${currentDate.toISOString().slice(0, 7)}`;
    
    // Process template variables
    const templateVariables = {
      newsletter_title: title,
      month: monthName,
      year: year.toString(),
      recent_posts: recentPosts.rows.map(post => ({
        title: post.title,
        url: `${process.env.NEXTAUTH_URL}/blog/${post.slug}`,
        excerpt: post.excerpt || 'Click to read more...',
        date: new Date(post.date).toLocaleDateString(),
        read_time: post.read_time || 5
      })),
      recent_projects: recentProjects.rows.map(project => ({
        title: project.title,
        url: `${process.env.NEXTAUTH_URL}/projects/${project.slug}`,
        description: project.description,
        technologies: Array.isArray(project.technologies) 
          ? project.technologies.join(', ') 
          : project.technologies
      })),
      share_url: `${process.env.NEXTAUTH_URL}/newsletter/share`
    };
    
    // Generate HTML content from template
    let htmlContent = template.html_content;
    let plainTextContent = template.plain_text_content || '';
    let processedSubject = template.subject_template;
    
    // Simple template variable replacement (in a real implementation, use a proper template engine)
    const replaceTemplateVars = (content: string, vars: any): string => {
      let result = content;
      
      // Replace simple variables
      Object.entries(vars).forEach(([key, value]) => {
        if (typeof value === 'string') {
          const regex = new RegExp(`{{${key}}}`, 'g');
          result = result.replace(regex, value);
        }
      });
      
      // Replace post arrays (simple implementation)
      if (vars.recent_posts && vars.recent_posts.length > 0) {
        const postsHtml = vars.recent_posts.map((post: any) => `
          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0;"><a href="${post.url}" style="color: #2563eb; text-decoration: none;">${post.title}</a></h3>
            <p style="color: #666; margin: 0 0 10px 0;">${post.excerpt}</p>
            <div style="color: #888; font-size: 14px;">${post.date} • ${post.read_time} min read</div>
          </div>
        `).join('');
        
        result = result.replace(/{{#recent_posts}}[\s\S]*?{{\/recent_posts}}/g, postsHtml);
      } else {
        result = result.replace(/{{#recent_posts}}[\s\S]*?{{\/recent_posts}}/g, '<p>No recent posts this month.</p>');
      }
      
      // Replace project arrays
      if (vars.recent_projects && vars.recent_projects.length > 0) {
        const projectsHtml = vars.recent_projects.map((project: any) => `
          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0;"><a href="${project.url}" style="color: #2563eb; text-decoration: none;">${project.title}</a></h3>
            <p style="color: #666; margin: 0 0 10px 0;">${project.description}</p>
            <div style="color: #888; font-size: 14px;">Technologies: ${project.technologies}</div>
          </div>
        `).join('');
        
        result = result.replace(/{{#recent_projects}}[\s\S]*?{{\/recent_projects}}/g, projectsHtml);
      } else {
        result = result.replace(/{{#recent_projects}}[\s\S]*?{{\/recent_projects}}/g, '<p>No recent projects this month.</p>');
      }
      
      return result;
    };
    
    htmlContent = replaceTemplateVars(htmlContent, templateVariables);
    plainTextContent = replaceTemplateVars(plainTextContent, templateVariables);
    processedSubject = replaceTemplateVars(processedSubject, templateVariables);
    
    // Create the newsletter campaign
    const campaignResult = await query(
      `INSERT INTO newsletter_campaigns 
       (title, slug, subject, content, html_content, plain_text_content, 
        template_id, type, status, scheduled_send_at, author, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, title, slug, subject, status, scheduled_send_at, created_at`,
      [
        title,
        slug,
        processedSubject,
        `Monthly newsletter featuring ${recentPosts.rows.length} recent posts and ${recentProjects.rows.length} projects.`,
        htmlContent,
        plainTextContent,
        template.id,
        'automated',
        'scheduled', // Start as scheduled
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for tomorrow
        'Automated System',
        null // No specific user created this
      ]
    );
    
    const campaign = campaignResult.rows[0];
    
    // Update the automation rule's last run time
    await query(
      `UPDATE newsletter_automation_rules 
       SET last_run_at = CURRENT_TIMESTAMP,
           next_run_at = date_trunc('month', CURRENT_DATE) + interval '1 month'
       WHERE type = 'monthly_digest'`
    );
    
    return NextResponse.json({
      success: true,
      message: 'Monthly digest newsletter generated successfully',
      campaign: campaign,
      stats: {
        recentPosts: recentPosts.rows.length,
        recentProjects: recentProjects.rows.length
      }
    });
    
  } catch (error) {
    console.error('Error generating monthly digest:', error);
    throw error;
  }
} 