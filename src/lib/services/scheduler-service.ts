import { query } from '@/lib/db';

/**
 * Scheduler Service for Automated Content Publishing
 * Handles scheduled publishing of posts, projects, and newsletter campaigns
 */

export interface ScheduledContentStats {
  postsToPublish: number;
  projectsToPublish: number;
  newslettersToSend: number;
  lastRunAt: Date;
}

export class SchedulerService {
  /**
   * Main scheduler function - publishes all scheduled content
   */
  static async publishScheduledContent(): Promise<ScheduledContentStats> {
    const now = new Date();
    const stats = {
      postsToPublish: 0,
      projectsToPublish: 0,
      newslettersToSend: 0,
      lastRunAt: now
    };

    try {
      // Get counts before publishing
      const postCount = await this.getScheduledPostsCount();
      const projectCount = await this.getScheduledProjectsCount();
      const newsletterCount = await this.getScheduledNewslettersCount();

      stats.postsToPublish = postCount;
      stats.projectsToPublish = projectCount;
      stats.newslettersToSend = newsletterCount;

      // Publish scheduled posts
      await this.publishScheduledPosts(now);
      console.log(`📝 Published ${postCount} scheduled posts`);

      // Publish scheduled projects
      await this.publishScheduledProjects(now);
      console.log(`🚀 Published ${projectCount} scheduled projects`);

      // Send scheduled newsletters
      await this.sendScheduledNewsletters(now);
      console.log(`📧 Sent ${newsletterCount} scheduled newsletters`);

      return stats;
    } catch (error) {
      console.error('Error in scheduled content publishing:', error);
      throw error;
    }
  }

  /**
   * Publish posts that are scheduled to be published
   */
  private static async publishScheduledPosts(now: Date): Promise<void> {
    const result = await query(
      `UPDATE posts 
       SET status = 'published', 
           published = true,
           published_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE status = 'scheduled' 
         AND scheduled_publish_at <= $1
       RETURNING id, title, slug`,
      [now]
    );

    // Log published posts
    result.rows.forEach(post => {
      console.log(`✅ Published post: "${post.title}" (${post.slug})`);
    });
  }

  /**
   * Publish projects that are scheduled to be published
   */
  private static async publishScheduledProjects(now: Date): Promise<void> {
    const result = await query(
      `UPDATE projects 
       SET status = 'published',
           published_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE status = 'scheduled' 
         AND scheduled_publish_at <= $1
       RETURNING id, title, slug`,
      [now]
    );

    // Log published projects
    result.rows.forEach(project => {
      console.log(`✅ Published project: "${project.title}" (${project.slug})`);
    });
  }

  /**
   * Send newsletters that are scheduled to be sent
   */
  private static async sendScheduledNewsletters(now: Date): Promise<void> {
    const result = await query(
      `SELECT * FROM newsletter_campaigns 
       WHERE status = 'scheduled' 
         AND scheduled_send_at <= $1`,
      [now]
    );

    for (const campaign of result.rows) {
      try {
        // Update status to 'sending'
        await query(
          'UPDATE newsletter_campaigns SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['sending', campaign.id]
        );

        // Send the newsletter
        const recipientCount = await this.sendNewsletter(campaign);

        // Update status to 'sent' with recipient count
        await query(
          `UPDATE newsletter_campaigns 
           SET status = $1, 
               sent_at = CURRENT_TIMESTAMP, 
               recipient_count = $2,
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          ['sent', recipientCount, campaign.id]
        );

        console.log(`✅ Sent newsletter: "${campaign.title}" to ${recipientCount} recipients`);
      } catch (error) {
        console.error(`❌ Failed to send newsletter "${campaign.title}":`, error);
        
        // Update status to 'draft' to allow retry
        await query(
          'UPDATE newsletter_campaigns SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['draft', campaign.id]
        );
      }
    }
  }

  /**
   * Send a newsletter campaign to targeted users
   */
  private static async sendNewsletter(campaign: any): Promise<number> {
    try {
      // Get recipients based on target access levels
      const recipients = await this.getNewsletterRecipients(campaign.target_access_levels);
      
      // In a real implementation, you would integrate with an email service
      // For now, we'll just log the sending action
      console.log(`📨 Sending newsletter "${campaign.title}" to ${recipients.length} recipients`);
      
      // TODO: Integrate with email service provider (SendGrid, Mailgun, etc.)
      // Example:
      // await this.sendEmail({
      //   to: recipients,
      //   subject: campaign.subject,
      //   html: campaign.content,
      //   from: process.env.NEWSLETTER_FROM_EMAIL
      // });

      return recipients.length;
    } catch (error) {
      console.error('Error sending newsletter:', error);
      throw error;
    }
  }

  /**
   * Get newsletter recipients based on access levels
   */
  private static async getNewsletterRecipients(targetAccessLevels: string[]): Promise<string[]> {
    const recipients = new Set<string>();

    // If targeting 'all' users, get all users
    if (targetAccessLevels.includes('all')) {
      const allUsers = await query('SELECT email FROM users WHERE email IS NOT NULL');
      allUsers.rows.forEach(user => recipients.add(user.email));
    }

    // Get users with specific access levels
    const conditions = [];
    if (targetAccessLevels.includes('professional')) {
      conditions.push('has_professional_access = true');
    }
    if (targetAccessLevels.includes('personal')) {
      conditions.push('has_personal_access = true');
    }

    if (conditions.length > 0) {
      const whereClause = conditions.join(' OR ');
      const accessUsers = await query(
        `SELECT email FROM user_access_levels 
         WHERE (${whereClause}) AND is_active = true`
      );
      accessUsers.rows.forEach(user => recipients.add(user.email));
    }

    // Also get newsletter subscribers if they exist
    const subscribers = await query('SELECT email FROM newsletter_subscribers WHERE is_active = true');
    subscribers.rows.forEach(subscriber => recipients.add(subscriber.email));

    return Array.from(recipients);
  }

  /**
   * Get count of scheduled posts ready to publish
   */
  private static async getScheduledPostsCount(): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM posts WHERE status = $1 AND scheduled_publish_at <= $2',
      ['scheduled', new Date()]
    );
    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Get count of scheduled projects ready to publish
   */
  private static async getScheduledProjectsCount(): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM projects WHERE status = $1 AND scheduled_publish_at <= $2',
      ['scheduled', new Date()]
    );
    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Get count of scheduled newsletters ready to send
   */
  private static async getScheduledNewslettersCount(): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM newsletter_campaigns WHERE status = $1 AND scheduled_send_at <= $2',
      ['scheduled', new Date()]
    );
    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Get scheduled content summary for admin dashboard
   */
  static async getScheduledContentSummary(): Promise<{
    upcomingPosts: any[];
    upcomingProjects: any[];
    upcomingNewsletters: any[];
    totalScheduled: number;
  }> {
    try {
      // Get upcoming scheduled posts
      const postsResult = await query(
        `SELECT id, title, slug, scheduled_publish_at, permission_level
         FROM posts 
         WHERE status = 'scheduled' 
         ORDER BY scheduled_publish_at ASC 
         LIMIT 10`
      );

      // Get upcoming scheduled projects
      const projectsResult = await query(
        `SELECT id, title, slug, scheduled_publish_at, permission_level
         FROM projects 
         WHERE status = 'scheduled' 
         ORDER BY scheduled_publish_at ASC 
         LIMIT 10`
      );

      // Get upcoming scheduled newsletters
      const newslettersResult = await query(
        `SELECT id, title, subject, scheduled_send_at, target_access_levels
         FROM newsletter_campaigns 
         WHERE status = 'scheduled' 
         ORDER BY scheduled_send_at ASC 
         LIMIT 10`
      );

      const totalScheduled = postsResult.rows.length + projectsResult.rows.length + newslettersResult.rows.length;

      return {
        upcomingPosts: postsResult.rows,
        upcomingProjects: projectsResult.rows,
        upcomingNewsletters: newslettersResult.rows,
        totalScheduled
      };
    } catch (error) {
      console.error('Error getting scheduled content summary:', error);
      return {
        upcomingPosts: [],
        upcomingProjects: [],
        upcomingNewsletters: [],
        totalScheduled: 0
      };
    }
  }

  /**
   * Manually trigger scheduled content publishing (for admin use)
   */
  static async runSchedulerManually(): Promise<ScheduledContentStats> {
    console.log('🔄 Manually triggering scheduled content publishing...');
    return await this.publishScheduledContent();
  }

  /**
   * Get scheduler health status
   */
  static async getSchedulerHealth(): Promise<{
    isHealthy: boolean;
    lastRun: Date | null;
    pendingCount: number;
    errors: string[];
  }> {
    try {
      const [postsCount, projectsCount, newslettersCount] = await Promise.all([
        this.getScheduledPostsCount(),
        this.getScheduledProjectsCount(),
        this.getScheduledNewslettersCount()
      ]);

      return {
        isHealthy: true,
        lastRun: new Date(), // This would be stored in a status table in production
        pendingCount: postsCount + projectsCount + newslettersCount,
        errors: []
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastRun: null,
        pendingCount: 0,
        errors: [error.message]
      };
    }
  }
} 