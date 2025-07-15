'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  EnvelopeIcon,
  PhotoIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalPosts: number;
  totalProjects: number;
  totalUsers: number;
  totalContentActivity: number;
  totalAccessRequests: number;
  pendingAccessRequests: number;
  activeAccessLevels: number;
  recentContent: Array<{
    title: string;
    slug: string;
    type: string;
    createdAt: string;
    featured?: boolean;
    status?: string;
  }>;
  popularPosts: Array<{
    title: string;
    slug: string;
    daysSinceCreated: number;
    featured?: boolean;
    status?: string;
  }>;
  contentStats: {
    publishedPosts: number;
    draftPosts: number;
    scheduledPosts: number;
    totalProjects: number;
    draftProjects: number;
    scheduledProjects: number;
    pendingAccessRequests: number;
    activeUsers: number;
  };
  newsletterStats: {
    totalSubscribers: number;
    totalCampaigns: number;
    totalMediaFiles: number;
  };
  systemStats: {
    totalUsers: number;
    totalAccessRequests: number;
    approvedAccessRequests: number;
    contentActivity: number;
  };
}

interface DashboardAnalyticsProps {
  profileData: { name: string };
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ profileData }) => {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract first name from the profile name
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0] || 'Admin';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Failed to load analytics data</p>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, subtitle, alertType, href, onClick }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    subtitle?: string;
    alertType?: 'warning' | 'success' | 'info';
    href?: string;
    onClick?: () => void;
  }) => {
    const cardContent = (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className={`text-sm mt-1 ${
                alertType === 'warning' ? 'text-amber-600' : 
                alertType === 'success' ? 'text-green-600' : 
                'text-gray-500'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${
            alertType === 'warning' ? 'bg-amber-100 dark:bg-amber-900' :
            alertType === 'success' ? 'bg-green-100 dark:bg-green-900' :
            'bg-primary-100 dark:bg-primary-900'
          }`}>
            <Icon className={`h-6 w-6 ${
              alertType === 'warning' ? 'text-amber-600 dark:text-amber-400' :
              alertType === 'success' ? 'text-green-600 dark:text-green-400' :
              'text-primary-600 dark:text-primary-400'
            }`} />
          </div>
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href}>
          {cardContent}
        </Link>
      );
    }

    if (onClick) {
      return (
        <div onClick={onClick}>
          {cardContent}
        </div>
      );
    }

    return cardContent;
  };

  const ClickableCard = ({ children, href, onClick, className = "" }: {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    className?: string;
  }) => {
    const cardContent = (
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col ${className}`}>
        {children}
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="h-full">
          {cardContent}
        </Link>
      );
    }

    if (onClick) {
      return (
        <div onClick={onClick} className="h-full">
          {cardContent}
        </div>
      );
    }

    return cardContent;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message and Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Welcome back, {getFirstName(profileData.name)}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Here's what's happening with your website today.
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Published Content"
          value={analytics.totalPosts + analytics.totalProjects}
          icon={DocumentTextIcon}
          subtitle={`${analytics.totalPosts} posts, ${analytics.totalProjects} projects`}
          alertType="info"
          href="/admin/content-management"
        />
        <StatCard
          title="System Users"
          value={analytics.totalUsers}
          icon={UserGroupIcon}
          subtitle={`${analytics.activeAccessLevels} with access`}
          alertType="success"
          href="/admin/users"
        />
        <StatCard
          title="Access Requests"
          value={analytics.totalAccessRequests}
          icon={ShieldCheckIcon}
          subtitle={analytics.pendingAccessRequests > 0 ? `${analytics.pendingAccessRequests} pending` : 'All processed'}
          alertType={analytics.pendingAccessRequests > 0 ? 'warning' : 'success'}
          href="/admin/access-requests"
        />
        <StatCard
          title="Content Activity"
          value={analytics.totalContentActivity}
          icon={ArrowTrendingUpIcon}
          subtitle={`New content in ${timeRange}`}
          alertType="info"
          href="/admin/content-scheduler"
        />
      </div>

      {/* Newsletter, Media Library, and User Access Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <ClickableCard href="/admin/newsletter">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Newsletter</h3>
            <EnvelopeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Subscribers</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.newsletterStats.totalSubscribers}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Campaigns</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.newsletterStats.totalCampaigns}
              </span>
            </div>
          </div>
        </ClickableCard>

        <ClickableCard href="/admin/media-library">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Media Library</h3>
            <PhotoIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Files</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.newsletterStats.totalMediaFiles}
              </span>
            </div>
          </div>
        </ClickableCard>

        <ClickableCard href="/admin/access-requests">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Access</h3>
            <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Requests</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.systemStats.totalAccessRequests}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.systemStats.approvedAccessRequests}
              </span>
            </div>
            {analytics.pendingAccessRequests > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-amber-600">Pending</span>
                <span className="text-sm font-medium text-amber-600">
                  {analytics.pendingAccessRequests}
                </span>
              </div>
            )}
          </div>
        </ClickableCard>
      </div>

      {/* Recent Posts and Content Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Recent Posts */}
        <ClickableCard href="/admin/content-management?tab=posts">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Posts</h3>
          <div className="space-y-3 flex-1">
            {analytics.popularPosts.length > 0 ? (
              analytics.popularPosts.map((post, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {post.title}
                      </p>
                      {post.featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Featured
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {post.status || 'Published'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">/{post.slug}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {post.daysSinceCreated === 0 ? 'Today' : 
                       post.daysSinceCreated === 1 ? '1 day ago' : 
                       `${post.daysSinceCreated} days ago`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No posts published yet</p>
            )}
          </div>
        </ClickableCard>

        {/* Content Statistics */}
        <ClickableCard href="/admin/content-management?tab=projects">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Statistics</h3>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Published Posts</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.contentStats.publishedPosts}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Draft Posts</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.contentStats.draftPosts}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled Posts</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.contentStats.scheduledPosts}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Projects</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.contentStats.totalProjects}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Draft Projects</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.contentStats.draftProjects}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled Projects</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.contentStats.scheduledProjects}
              </span>
            </div>
          </div>
        </ClickableCard>
      </div>

      {/* Recent Content Activity */}
      {analytics.recentContent.length > 0 && (
        <ClickableCard href="/admin/content-management">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Content Activity ({timeRange})
          </h3>
          <div className="space-y-3">
            {analytics.recentContent.map((content, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    content.type === 'post' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                  }`}>
                    {content.type === 'post' ? (
                      <DocumentTextIcon className={`h-4 w-4 ${
                        content.type === 'post' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                      }`} />
                    ) : (
                      <ChartBarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {content.title}
                      </p>
                      {content.featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Featured
                        </span>
                      )}
                      {content.status && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          content.status === 'published' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : content.status === 'draft'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {content.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {content.type} • /{content.slug}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(content.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </ClickableCard>
      )}
    </div>
  );
};

export default DashboardAnalytics; 