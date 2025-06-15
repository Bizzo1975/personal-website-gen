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

interface NewsletterDashboardStats {
  totalNewsletters: number;
  totalSubscribers: number;
  activeSubscribers: number;
  recentNewsletters: Newsletter[];
  recentSubscribers: NewsletterSubscriber[];
  analytics: Pick<NewsletterAnalytics, 'averageOpenRate' | 'averageClickRate' | 'newSubscribers' | 'netGrowth'>;
}

const NewsletterAdminPage: React.FC = () => {
  const [stats, setStats] = useState<NewsletterDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for development - replace with actual API calls
      const mockStats: NewsletterDashboardStats = {
        totalNewsletters: 24,
        totalSubscribers: 2847,
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
      setError('Failed to load newsletter statistics');
    } finally {
      setIsLoading(false);
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Newsletter Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, manage, and analyze your newsletter campaigns with permission-based audience targeting
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/newsletter/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Newsletter
          </Link>
          <Link
            href="/admin/newsletter/campaigns/create"
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Campaign
          </Link>
          <Link
            href="/admin/newsletter/settings"
            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <CogIcon className="h-5 w-5 mr-2" />
            Settings
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Newsletters</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.totalNewsletters}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Subscribers</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.activeSubscribers.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                +{stats?.analytics.newSubscribers} this month
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <EyeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Open Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatPercent(stats?.analytics.averageOpenRate || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Click Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatPercent(stats?.analytics.averageClickRate || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/newsletter/newsletters"
          className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <EnvelopeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Newsletters</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Create, edit, and schedule newsletters
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/newsletter/subscribers"
          className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserGroupIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Subscribers</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                View and manage your subscriber base
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/newsletter/templates"
          className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <DocumentTextIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Newsletter Templates</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Create and manage email templates
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/newsletter/analytics"
          className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Track performance and engagement
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Newsletters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Newsletters</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.recentNewsletters.map((newsletter) => (
                <div key={newsletter.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{newsletter.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{newsletter.subject}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(newsletter.status)}`}>
                        {getStatusIcon(newsletter.status)}
                        <span className="ml-1 capitalize">{newsletter.status}</span>
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {newsletter.sentAt ? formatDate(newsletter.sentAt) : formatDate(newsletter.createdAt)}
                      </span>
                      {newsletter.stats && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatPercent(newsletter.stats.openRate)} open rate
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/newsletter/newsletters/${newsletter.id}`}
                    className="ml-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/admin/newsletter/newsletters"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
              >
                View all newsletters →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Subscribers</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.recentSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {subscriber.firstName ? `${subscriber.firstName} ${subscriber.lastName || ''}`.trim() : subscriber.email}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subscriber.email}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscriber.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {subscriber.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(subscriber.subscribedAt)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/newsletter/subscribers/${subscriber.id}`}
                    className="ml-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/admin/newsletter/subscribers"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
              >
                View all subscribers →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterAdminPage; 