import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { notifyMeManagerTeaser } from '@/lib/me-manager-teaser';
import { sendCampaign } from '@/lib/newsletter/delivery';

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
      console.log(`📧 Processed ${newsletterCount} due newsletters (per-campaign results logged above)`);

      return stats;
    } catch (error) {
      console.error('Error in scheduled content publishing:', error);
      throw error;
    }
  }

  /**
   * Publish posts that are scheduled to be published,
   * then fire ME Manager teasers and revalidate blog paths.
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
       RETURNING id, title, slug, excerpt`,
      [now]
    );

    for (const post of result.rows) {
      console.log(`✅ Published post: "${post.title}" (${post.slug})`);

      try {
        const teaser = await notifyMeManagerTeaser({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
        });
        console.log(`📣 Teaser for "${post.title}":`, teaser);
      } catch (error) {
        console.error(`❌ Teaser failed for "${post.title}":`, error);
      }

      try {
        revalidatePath('/blog');
        revalidatePath(`/blog/${post.slug}`);
        revalidatePath('/');
      } catch (error) {
        console.error(`⚠️ Revalidate failed for "${post.slug}":`, error);
      }
    }
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
   * Send newsletters whose scheduled time has passed, through real delivery
   * (lib/newsletter/delivery). A campaign stuck in 'sending' for over an hour
   * (process stopped mid-send) is marked 'failed' — it is not re-sent
   * automatically, because some recipients may already have it.
   */
  private static async sendScheduledNewsletters(now: Date): Promise<void> {
    await query(
      `UPDATE newsletter_campaigns
          SET status = 'failed',
              last_error = 'Sending was interrupted; check the send log before re-sending',
              updated_at = CURRENT_TIMESTAMP
        WHERE status = 'sending' AND send_started_at < $1::timestamp - interval '1 hour'`,
      [now]
    );

    const due = await query(
      `SELECT id, title FROM newsletter_campaigns
        WHERE status = 'scheduled' AND scheduled_send_at <= $1
        ORDER BY scheduled_send_at`,
      [now]
    );

    for (const campaign of due.rows) {
      const outcome = await sendCampaign(campaign.id, ['scheduled']);
      if (outcome.status === 'not_sent') {
        // Not claimed or nobody to send to: record why and leave it scheduled for the operator.
        await query(
          `UPDATE newsletter_campaigns SET last_error = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND status = 'scheduled'`,
          [campaign.id, outcome.error || 'Not sent']
        );
        console.error(`❌ Newsletter "${campaign.title}" not sent: ${outcome.error}`);
      } else {
        console.log(
          `${outcome.ok ? '✅' : '❌'} Newsletter "${campaign.title}": ${outcome.sent}/${outcome.recipients} sent, ${outcome.failed} failed`
        );
      }
    }
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
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
} 