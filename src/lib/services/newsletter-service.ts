import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Newsletter Service for Campaign Management
 * Handles newsletter campaigns with access-level targeting and scheduling
 */

export interface NewsletterCampaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  target_access_levels: string[];
  scheduled_send_at?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  sent_at?: Date;
  recipient_count: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribed_at: Date;
  is_active: boolean;
  unsubscribe_token: string;
}

export interface CampaignCreateData {
  title: string;
  subject: string;
  content: string;
  targetAccessLevels: string[];
  scheduledSendAt?: Date;
  createdBy: string;
}

export interface NewsletterStats {
  totalCampaigns: number;
  sentCampaigns: number;
  scheduledCampaigns: number;
  totalSubscribers: number;
  activeSubscribers: number;
  totalRecipients: number;
}

export class NewsletterService {
  /**
   * Create a new newsletter campaign
   */
  static async createCampaign(campaignData: CampaignCreateData): Promise<NewsletterCampaign> {
    try {
      // Validate target access levels
      const validAccessLevels = ['all', 'professional', 'personal'];
      const invalidLevels = campaignData.targetAccessLevels.filter(
        level => !validAccessLevels.includes(level)
      );
      
      if (invalidLevels.length > 0) {
        throw new Error(`Invalid access levels: ${invalidLevels.join(', ')}`);
      }

      const status = campaignData.scheduledSendAt ? 'scheduled' : 'draft';
      
      const result = await query(
        `INSERT INTO newsletter_campaigns 
         (id, title, subject, content, target_access_levels, scheduled_send_at, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          uuidv4(),
          campaignData.title,
          campaignData.subject,
          campaignData.content,
          campaignData.targetAccessLevels,
          campaignData.scheduledSendAt || null,
          status,
          campaignData.createdBy
        ]
      );

      const campaign = result.rows[0] as NewsletterCampaign;
      console.log(`✅ Created newsletter campaign: "${campaign.title}" (${campaign.status})`);
      
      return campaign;
    } catch (error) {
      console.error('Error creating newsletter campaign:', error);
      throw error;
    }
  }

  /**
   * Get all newsletter campaigns with filtering
   */
  static async getCampaigns(filters: {
    status?: string;
    createdBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    campaigns: NewsletterCampaign[];
    total: number;
  }> {
    try {
      const { status, createdBy, limit = 20, offset = 0 } = filters;
      
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(status);
      }

      if (createdBy) {
        conditions.push(`created_by = $${paramIndex++}`);
        params.push(createdBy);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM newsletter_campaigns ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0]?.total || '0');

      // Get campaigns
      const campaignsResult = await query(
        `SELECT * FROM newsletter_campaigns 
         ${whereClause}
         ORDER BY created_at DESC 
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limit, offset]
      );

      return {
        campaigns: campaignsResult.rows as NewsletterCampaign[],
        total
      };
    } catch (error) {
      console.error('Error getting newsletter campaigns:', error);
      throw error;
    }
  }

  /**
   * Get a single campaign by ID
   */
  static async getCampaignById(id: string): Promise<NewsletterCampaign | null> {
    try {
      const result = await query('SELECT * FROM newsletter_campaigns WHERE id = $1', [id]);
      return result.rows[0] as NewsletterCampaign || null;
    } catch (error) {
      console.error('Error getting campaign by ID:', error);
      throw error;
    }
  }

  /**
   * Update a newsletter campaign
   */
  static async updateCampaign(
    id: string,
    updates: Partial<Pick<NewsletterCampaign, 'title' | 'subject' | 'content' | 'target_access_levels' | 'scheduled_send_at' | 'status'>>
  ): Promise<NewsletterCampaign | null> {
    try {
      const setClause = [];
      const params = [];
      let paramIndex = 1;

      if (updates.title) {
        setClause.push(`title = $${paramIndex++}`);
        params.push(updates.title);
      }

      if (updates.subject) {
        setClause.push(`subject = $${paramIndex++}`);
        params.push(updates.subject);
      }

      if (updates.content) {
        setClause.push(`content = $${paramIndex++}`);
        params.push(updates.content);
      }

      if (updates.target_access_levels) {
        setClause.push(`target_access_levels = $${paramIndex++}`);
        params.push(updates.target_access_levels);
      }

      if (updates.scheduled_send_at !== undefined) {
        setClause.push(`scheduled_send_at = $${paramIndex++}`);
        params.push(updates.scheduled_send_at);
      }

      if (updates.status) {
        setClause.push(`status = $${paramIndex++}`);
        params.push(updates.status);
      }

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const result = await query(
        `UPDATE newsletter_campaigns 
         SET ${setClause.join(', ')} 
         WHERE id = $${paramIndex} 
         RETURNING *`,
        params
      );

      return result.rows[0] as NewsletterCampaign || null;
    } catch (error) {
      console.error('Error updating newsletter campaign:', error);
      throw error;
    }
  }

  /**
   * Delete a newsletter campaign
   */
  static async deleteCampaign(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM newsletter_campaigns WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting newsletter campaign:', error);
      throw error;
    }
  }

  /**
   * Get newsletter recipients based on access levels
   */
  static async getRecipientsByAccessLevels(targetAccessLevels: string[]): Promise<{
    recipients: string[];
    breakdown: Record<string, number>;
  }> {
    try {
      const recipients = new Set<string>();
      const breakdown = {};

      // If targeting 'all' users, get all users
      if (targetAccessLevels.includes('all')) {
        const allUsers = await query(
          'SELECT DISTINCT email FROM users WHERE email IS NOT NULL AND email != \'\''
        );
        allUsers.rows.forEach(user => recipients.add(user.email));
        breakdown['all'] = allUsers.rows.length;
      }

      // Get users with specific access levels
      const accessConditions = [];
      if (targetAccessLevels.includes('professional')) {
        accessConditions.push('has_professional_access = true');
      }
      if (targetAccessLevels.includes('personal')) {
        accessConditions.push('has_personal_access = true');
      }

      if (accessConditions.length > 0) {
        const whereClause = accessConditions.join(' OR ');
        const accessUsers = await query(
          `SELECT DISTINCT email FROM user_access_levels 
           WHERE (${whereClause}) AND is_active = true`
        );
        
        const professionalCount = targetAccessLevels.includes('professional') ? 
          await this.getAccessLevelCount('professional') : 0;
        const personalCount = targetAccessLevels.includes('personal') ? 
          await this.getAccessLevelCount('personal') : 0;

        breakdown['professional'] = professionalCount;
        breakdown['personal'] = personalCount;

        accessUsers.rows.forEach(user => recipients.add(user.email));
      }

      // Also get newsletter subscribers
      const subscribers = await query(
        'SELECT DISTINCT email FROM newsletter_subscribers WHERE is_active = true'
      );
      subscribers.rows.forEach(subscriber => recipients.add(subscriber.email));
      breakdown['subscribers'] = subscribers.rows.length;

      return {
        recipients: Array.from(recipients),
        breakdown
      };
    } catch (error) {
      console.error('Error getting newsletter recipients:', error);
      throw error;
    }
  }

  /**
   * Get count of users with specific access level
   */
  private static async getAccessLevelCount(accessLevel: 'professional' | 'personal'): Promise<number> {
    const field = accessLevel === 'professional' ? 'has_professional_access' : 'has_personal_access';
    const result = await query(
      `SELECT COUNT(*) as count FROM user_access_levels WHERE ${field} = true AND is_active = true`
    );
    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Schedule a campaign for sending
   */
  static async scheduleCampaign(id: string, scheduledSendAt: Date): Promise<NewsletterCampaign | null> {
    try {
      const result = await query(
        `UPDATE newsletter_campaigns 
         SET scheduled_send_at = $1, status = 'scheduled', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 
         RETURNING *`,
        [scheduledSendAt, id]
      );

      return result.rows[0] as NewsletterCampaign || null;
    } catch (error) {
      console.error('Error scheduling campaign:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled campaign
   */
  static async cancelCampaign(id: string): Promise<NewsletterCampaign | null> {
    try {
      const result = await query(
        `UPDATE newsletter_campaigns 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'scheduled'
         RETURNING *`,
        [id]
      );

      return result.rows[0] as NewsletterCampaign || null;
    } catch (error) {
      console.error('Error cancelling campaign:', error);
      throw error;
    }
  }

  /**
   * Add a newsletter subscriber
   */
  static async addSubscriber(email: string, name?: string): Promise<NewsletterSubscriber> {
    try {
      // Check if subscriber already exists
      const existing = await query(
        'SELECT * FROM newsletter_subscribers WHERE email = $1',
        [email]
      );

      if (existing.rows.length > 0) {
        // Reactivate if inactive
        const result = await query(
          'UPDATE newsletter_subscribers SET is_active = true WHERE email = $1 RETURNING *',
          [email]
        );
        return result.rows[0] as NewsletterSubscriber;
      }

      // Create new subscriber
      const result = await query(
        `INSERT INTO newsletter_subscribers (id, email, name, unsubscribe_token)
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [uuidv4(), email, name || null, uuidv4()]
      );

      return result.rows[0] as NewsletterSubscriber;
    } catch (error) {
      console.error('Error adding newsletter subscriber:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe using token
   */
  static async unsubscribe(token: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE newsletter_subscribers SET is_active = false WHERE unsubscribe_token = $1',
        [token]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  }

  /**
   * Get newsletter statistics
   */
  static async getNewsletterStats(): Promise<NewsletterStats> {
    try {
      // Campaign stats
      const campaignStats = await query(`
        SELECT 
          COUNT(*) as total_campaigns,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_campaigns,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_campaigns,
          COALESCE(SUM(recipient_count), 0) as total_recipients
        FROM newsletter_campaigns
      `);

      // Subscriber stats
      const subscriberStats = await query(`
        SELECT 
          COUNT(*) as total_subscribers,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_subscribers
        FROM newsletter_subscribers
      `);

      const campaigns = campaignStats.rows[0];
      const subscribers = subscriberStats.rows[0];

      return {
        totalCampaigns: parseInt(campaigns.total_campaigns || '0'),
        sentCampaigns: parseInt(campaigns.sent_campaigns || '0'),
        scheduledCampaigns: parseInt(campaigns.scheduled_campaigns || '0'),
        totalSubscribers: parseInt(subscribers.total_subscribers || '0'),
        activeSubscribers: parseInt(subscribers.active_subscribers || '0'),
        totalRecipients: parseInt(campaigns.total_recipients || '0')
      };
    } catch (error) {
      console.error('Error getting newsletter stats:', error);
      throw error;
    }
  }

  /**
   * Get upcoming scheduled campaigns
   */
  static async getUpcomingCampaigns(limit: number = 10): Promise<NewsletterCampaign[]> {
    try {
      const result = await query(
        `SELECT * FROM newsletter_campaigns 
         WHERE status = 'scheduled' AND scheduled_send_at > CURRENT_TIMESTAMP
         ORDER BY scheduled_send_at ASC 
         LIMIT $1`,
        [limit]
      );

      return result.rows as NewsletterCampaign[];
    } catch (error) {
      console.error('Error getting upcoming campaigns:', error);
      throw error;
    }
  }

  /**
   * Get campaign preview with recipient count
   */
  static async getCampaignPreview(id: string): Promise<{
    campaign: NewsletterCampaign;
    recipientCount: number;
    recipientBreakdown: Record<string, number>;
  } | null> {
    try {
      const campaign = await this.getCampaignById(id);
      if (!campaign) {
        return null;
      }

      const { recipients, breakdown } = await this.getRecipientsByAccessLevels(
        campaign.target_access_levels
      );

      return {
        campaign,
        recipientCount: recipients.length,
        recipientBreakdown: breakdown
      };
    } catch (error) {
      console.error('Error getting campaign preview:', error);
      throw error;
    }
  }
} 