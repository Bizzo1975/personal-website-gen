'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  EnvelopeIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Newsletter, NewsletterSubscriber, NewsletterAnalytics } from '@/types/newsletter';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import {
  BiPlus,
  BiEnvelope,
  BiUser,
  BiCalendar,
  BiBarChart,
  BiCog,
  BiTrendingUp,
  BiDownload,
  BiSend,
  BiEdit,
  BiTrash,
  BiDuplicate,
  BiPause,
  BiPlay,
  BiStop,
  BiArchive,
  BiCheck,
  BiX,
  BiTime,
  BiStats,
  BiRefresh
} from 'react-icons/bi';
import AdminPageLayout from '../components/AdminPageLayout';
import { AdminInput, AdminTextarea, AdminSelect } from '../components/AdminFormField';

interface NewsletterDashboardStats {
  totalNewsletters: number;
  totalSubscribers: number;
  activeSubscribers: number;
  recentNewsletters: Newsletter[];
  recentSubscribers: NewsletterSubscriber[];
  analytics: Pick<NewsletterAnalytics, 'averageOpenRate' | 'averageClickRate' | 'newSubscribers' | 'netGrowth'>;
}

interface NewsletterStats {
  totalNewsletters: number;
  totalSubscribers: number;
  totalCampaigns: number;
  pendingCampaigns: number;
  averageOpenRate: number;
  averageClickRate: number;
}

interface NewsletterContent {
  title: string;
  description: string;
  incentive: string;
  footerText: string;
  weeklyArticlesIcon: string;
  weeklyArticlesTitle: string;
  weeklyArticlesDescription: string;
  exclusiveTipsIcon: string;
  exclusiveTipsTitle: string;
  exclusiveTipsDescription: string;
  earlyAccessIcon: string;
  earlyAccessTitle: string;
  earlyAccessDescription: string;
}

const NewsletterAdminPage: React.FC = () => {
  const [stats, setStats] = useState<NewsletterDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newsletterStats, setNewsletterStats] = useState<NewsletterStats>({
    totalNewsletters: 0,
    totalSubscribers: 0,
    totalCampaigns: 0,
    pendingCampaigns: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
  });
  const [content, setContent] = useState<NewsletterContent>({
    title: 'Stay in the Loop',
    description: 'Get notified about new projects, blog posts, and insights on modern web development.',
    incentive: '🚀 Plus exclusive tips, early access to new content, and behind-the-scenes updates',
    footerText: 'By subscribing, you agree to receive our newsletter and promotional emails.',
    weeklyArticlesIcon: 'book',
    weeklyArticlesTitle: 'Weekly Articles',
    weeklyArticlesDescription: 'In-depth tutorials and insights',
    exclusiveTipsIcon: 'lightning-bolt',
    exclusiveTipsTitle: 'Exclusive Tips',
    exclusiveTipsDescription: 'Subscriber-only content and resources',
    earlyAccessIcon: 'clock',
    earlyAccessTitle: 'Early Access',
    earlyAccessDescription: 'Be first to see new projects and posts'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Available icon options (matching IconSystem names)
  const iconOptions = [
    { value: 'document', label: 'Document' },
    { value: 'bolt', label: 'Lightning Bolt' },
    { value: 'clock', label: 'Clock' },
    { value: 'envelope', label: 'Envelope' },
    { value: 'star', label: 'Star' },
    { value: 'heart', label: 'Heart' },
    { value: 'fire', label: 'Fire' },
    { value: 'briefcase', label: 'Briefcase' },
    { value: 'pencil', label: 'Pencil' },
    { value: 'code', label: 'Code' },
    { value: 'globe', label: 'Globe' },
    { value: 'shield', label: 'Shield' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'trophy', label: 'Trophy' },
    { value: 'light-bulb', label: 'Light Bulb' },
    { value: 'chart-bar', label: 'Chart Bar' },
    { value: 'settings', label: 'Settings' },
    { value: 'user-group', label: 'User Group' },
    { value: 'academic-cap', label: 'Academic Cap' },
    { value: 'sparkles', label: 'Sparkles' }
  ];

  useEffect(() => {
    fetchDashboardStats();
    fetchStats();
    fetchNewsletterContent();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for development - replace with actual API calls
      const mockStats: NewsletterDashboardStats = {
        totalNewsletters: 24,
        totalSubscribers: 0,
        activeSubscribers: 2683,
        recentNewsletters: [
          {
            id: '1',
            title: 'Weekly Web Dev Digest #47',
            slug: 'weekly-digest-47',
            subject: 'Advanced React Patterns & Next.js 14 Updates',
            previewText: 'This week: React patterns, Next.js updates, and performance tips',
            content: '',
            htmlContent: '',
            plainTextContent: '',
            status: 'sent',
            type: 'blog_digest',
            permissions: {
              level: 'all',
              allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
              allowedUsers: [],
              restrictedUsers: [],
              requiresAuth: false,
              customRules: []
            },
            template: 'digest',
            author: 'admin',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            sentAt: new Date('2024-01-15'),
            stats: {
              totalSent: 2683,
              delivered: 2671,
              opened: 1605,
              clicked: 483,
              unsubscribed: 12,
              bounced: 12,
              openRate: 60.1,
              clickRate: 18.0,
              unsubscribeRate: 0.4,
              bounceRate: 0.4,
              topLinks: []
            }
          },
          {
            id: '2',
            title: 'New Project Launch Announcement',
            slug: 'project-launch-announcement',
            subject: 'Introducing Our Latest Open Source Project',
            previewText: 'We are excited to announce the launch of our new project',
            content: '',
            htmlContent: '',
            plainTextContent: '',
            status: 'scheduled',
            type: 'announcement',
            permissions: {
              level: 'professional',
              allowedRoles: ['admin', 'editor', 'author'],
              allowedUsers: [],
              restrictedUsers: [],
              requiresAuth: true,
              customRules: []
            },
            template: 'announcement',
            author: 'admin',
            createdAt: new Date('2024-01-14'),
            updatedAt: new Date('2024-01-14'),
            scheduledAt: new Date('2024-01-18')
          }
        ],
        recentSubscribers: [
          {
            id: '1',
            email: 'john.developer@email.com',
            firstName: 'John',
            interests: ['React', 'Next.js', 'TypeScript'],
            source: 'blog',
            status: 'active',
            accessLevel: 'all',
            userRole: 'subscriber',
            frequency: 'weekly',
            contentTypes: ['blog_posts', 'projects'],
            subscribedAt: new Date('2024-01-14'),
            confirmedAt: new Date('2024-01-14'),
            openRate: 75.0,
            clickRate: 25.0,
            totalEmailsReceived: 8,
            totalEmailsOpened: 6,
            totalLinksClicked: 2,
            tags: ['developer', 'frontend'],
            customFields: {
              company: 'Tech Corp',
              jobTitle: 'Frontend Developer'
            }
          }
        ],
        analytics: {
          averageOpenRate: 58.2,
          averageClickRate: 16.7,
          newSubscribers: 47,
          netGrowth: 35
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching newsletter stats:', error);
      setError('Failed to load newsletter data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/newsletter/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setNewsletterStats({
          totalNewsletters: data.totalNewsletters || 0,
          totalSubscribers: data.totalSubscribers || 0,
          totalCampaigns: data.totalCampaigns || 0,
          pendingCampaigns: data.pendingCampaigns || 0,
          averageOpenRate: data.averageOpenRate || 0,
          averageClickRate: data.averageClickRate || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch newsletter stats:', error);
    }
  };

  const fetchNewsletterContent = async () => {
    try {
      const response = await fetch('/api/admin/newsletter-content');
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Error fetching newsletter content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/newsletter-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        setMessage('Newsletter content updated successfully!');
      } else {
        setMessage('Failed to update newsletter content');
      }
    } catch (error) {
      console.error('Error saving newsletter content:', error);
      setMessage('Error saving newsletter content');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: Newsletter['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: Newsletter['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'scheduled':
        return <ClockIcon className="h-4 w-4" />;
      case 'draft':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'archived':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Newsletter Management">
      <AdminPageLayout
        title="Newsletter Content"
        description="Manage the newsletter signup section content and icons displayed on your website"
      >
        <div className="max-w-4xl">
          <Card>
            <form onSubmit={handleSave} className="space-y-8">
              {/* Basic Content Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Content
                </h3>
                <div className="space-y-6">
                  <AdminInput
                    id="newsletter-title"
                    label="Newsletter Title"
                    value={content.title}
                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                    required
                  />

                  <AdminTextarea
                    id="newsletter-description"
                    label="Description"
                    value={content.description}
                    onChange={(e) => setContent({ ...content, description: e.target.value })}
                    rows={3}
                    required
                  />

                  <AdminInput
                    id="newsletter-incentive"
                    label="Incentive Text"
                    value={content.incentive}
                    onChange={(e) => setContent({ ...content, incentive: e.target.value })}
                    placeholder="e.g., Get exclusive tips and insights"
                  />

                  <AdminTextarea
                    id="newsletter-footer-text"
                    label="Footer Text"
                    value={content.footerText}
                    onChange={(e) => setContent({ ...content, footerText: e.target.value })}
                    rows={4}
                    placeholder="Footer text and unsubscribe information..."
                  />
                </div>
              </div>

              {/* Features Section */}
              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Feature Highlights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Weekly Articles */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Weekly Articles
                    </h4>
                    <AdminSelect
                      id="weekly-articles-icon"
                      label="Icon"
                      value={content.weeklyArticlesIcon}
                      onChange={(e) => setContent({ ...content, weeklyArticlesIcon: e.target.value })}
                      options={iconOptions}
                    />
                    <AdminInput
                      id="weekly-articles-title"
                      label="Title"
                      value={content.weeklyArticlesTitle}
                      onChange={(e) => setContent({ ...content, weeklyArticlesTitle: e.target.value })}
                    />
                    <AdminTextarea
                      id="weekly-articles-description"
                      label="Description"
                      value={content.weeklyArticlesDescription}
                      onChange={(e) => setContent({ ...content, weeklyArticlesDescription: e.target.value })}
                      rows={2}
                    />
                  </div>

                  {/* Exclusive Tips */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Exclusive Tips
                    </h4>
                    <AdminSelect
                      id="exclusive-tips-icon"
                      label="Icon"
                      value={content.exclusiveTipsIcon}
                      onChange={(e) => setContent({ ...content, exclusiveTipsIcon: e.target.value })}
                      options={iconOptions}
                    />
                    <AdminInput
                      id="exclusive-tips-title"
                      label="Title"
                      value={content.exclusiveTipsTitle}
                      onChange={(e) => setContent({ ...content, exclusiveTipsTitle: e.target.value })}
                    />
                    <AdminTextarea
                      id="exclusive-tips-description"
                      label="Description"
                      value={content.exclusiveTipsDescription}
                      onChange={(e) => setContent({ ...content, exclusiveTipsDescription: e.target.value })}
                      rows={2}
                    />
                  </div>

                  {/* Early Access */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Early Access
                    </h4>
                    <AdminSelect
                      id="early-access-icon"
                      label="Icon"
                      value={content.earlyAccessIcon}
                      onChange={(e) => setContent({ ...content, earlyAccessIcon: e.target.value })}
                      options={iconOptions}
                    />
                    <AdminInput
                      id="early-access-title"
                      label="Title"
                      value={content.earlyAccessTitle}
                      onChange={(e) => setContent({ ...content, earlyAccessTitle: e.target.value })}
                    />
                    <AdminTextarea
                      id="early-access-description"
                      label="Description"
                      value={content.earlyAccessDescription}
                      onChange={(e) => setContent({ ...content, earlyAccessDescription: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {message && (
                <div className={`p-4 rounded-md ${
                  message.includes('successfully') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default NewsletterAdminPage; 