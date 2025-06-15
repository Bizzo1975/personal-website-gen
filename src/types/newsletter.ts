import { ContentPermissions } from './content/permissions';

/**
 * Newsletter template and campaign types
 */
export interface Newsletter {
  id: string;
  title: string;
  slug: string;
  subject: string;
  previewText: string;
  content: string;
  htmlContent: string;
  plainTextContent: string;
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
  type: 'regular' | 'blog_digest' | 'announcement' | 'custom';
  permissions: ContentPermissions;
  
  // Scheduling
  scheduledAt?: Date;
  sentAt?: Date;
  
  // Content sourcing
  includedPosts?: string[]; // Blog post IDs for digest newsletters
  includedProjects?: string[]; // Project IDs for project updates
  
  // Design
  template: string;
  headerImage?: string;
  footerContent?: string;
  
  // Metadata
  author: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Analytics
  stats?: NewsletterStats;
}

export interface NewsletterStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  topLinks: Array<{
    url: string;
    clicks: number;
  }>;
}

/**
 * Newsletter subscriber with enhanced permissions integration
 */
export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  interests: string[];
  source: string;
  status: 'active' | 'pending' | 'unsubscribed' | 'bounced';
  
  // Permission-based segmentation
  accessLevel: 'personal' | 'professional' | 'all';
  userRole?: 'admin' | 'editor' | 'author' | 'subscriber' | 'guest';
  
  // Subscription preferences
  frequency: 'daily' | 'weekly' | 'monthly' | 'digest_only';
  contentTypes: Array<'blog_posts' | 'projects' | 'announcements' | 'personal'>;
  
  // Timestamps
  subscribedAt: Date;
  confirmedAt?: Date;
  lastEmailSent?: Date;
  lastActivityAt?: Date;
  
  // Analytics
  openRate: number;
  clickRate: number;
  totalEmailsReceived: number;
  totalEmailsOpened: number;
  totalLinksClicked: number;
  
  // Segmentation tags
  tags: string[];
  customFields: Record<string, any>;
}

/**
 * Newsletter template for design consistency
 */
export interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  htmlTemplate: string;
  cssStyles: string;
  variables: Array<{
    name: string;
    type: 'text' | 'image' | 'color' | 'url';
    defaultValue: string;
    description: string;
  }>;
  category: 'basic' | 'blog_digest' | 'announcement' | 'custom';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Newsletter campaign for batch sending
 */
export interface NewsletterCampaign {
  id: string;
  newsletterId: string;
  name: string;
  
  // Audience segmentation
  targetAudience: {
    permissionLevel: 'personal' | 'professional' | 'all';
    userRoles?: string[];
    tags?: string[];
    interests?: string[];
    customQuery?: string;
  };
  
  // Delivery settings
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt?: Date;
  timezone: string;
  
  // Recurring settings
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    dayOfMonth?: number;
  };
  
  // Status and tracking
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  totalRecipients: number;
  sentAt?: Date;
  
  // Analytics
  stats: NewsletterStats;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Newsletter automation rules
 */
export interface NewsletterAutomation {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Trigger conditions
  trigger: {
    type: 'new_post' | 'new_project' | 'user_signup' | 'schedule' | 'tag_added';
    conditions: Record<string, any>;
  };
  
  // Actions
  actions: Array<{
    type: 'send_newsletter' | 'add_to_segment' | 'tag_subscriber';
    config: Record<string, any>;
  }>;
  
  // Execution history
  lastExecuted?: Date;
  executionCount: number;
  successCount: number;
  errorCount: number;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Newsletter analytics aggregation
 */
export interface NewsletterAnalytics {
  period: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';
  
  // Overall metrics
  totalNewsletters: number;
  totalCampaigns: number;
  totalSubscribers: number;
  activeSubscribers: number;
  
  // Performance metrics
  averageOpenRate: number;
  averageClickRate: number;
  averageUnsubscribeRate: number;
  averageBounceRate: number;
  
  // Growth metrics
  newSubscribers: number;
  unsubscribes: number;
  netGrowth: number;
  
  // Content performance
  topPerformingNewsletters: Array<{
    id: string;
    title: string;
    openRate: number;
    clickRate: number;
    sentAt: Date;
  }>;
  
  // Audience insights
  audienceBreakdown: {
    byPermissionLevel: Record<string, number>;
    byUserRole: Record<string, number>;
    byInterests: Record<string, number>;
    bySource: Record<string, number>;
  };
}

/**
 * Form interfaces for creating/editing newsletters
 */
export interface NewsletterFormData {
  title: string;
  subject: string;
  previewText: string;
  content: string;
  type: Newsletter['type'];
  permissions: ContentPermissions;
  template: string;
  headerImage?: string;
  footerContent?: string;
  includedPosts?: string[];
  includedProjects?: string[];
  scheduledAt?: Date;
}

export interface CampaignFormData {
  name: string;
  targetAudience: NewsletterCampaign['targetAudience'];
  scheduleType: NewsletterCampaign['scheduleType'];
  scheduledAt?: Date;
  timezone: string;
  recurringPattern?: NewsletterCampaign['recurringPattern'];
}

/**
 * API response interfaces
 */
export interface NewsletterListResponse {
  newsletters: Newsletter[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SubscriberListResponse {
  subscribers: NewsletterSubscriber[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CampaignListResponse {
  campaigns: NewsletterCampaign[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} 