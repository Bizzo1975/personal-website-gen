'use client';

import React, { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  EyeIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalViews: number;
  totalPosts: number;
  totalProjects: number;
  totalUsers: number;
  recentViews: number;
  popularPosts: Array<{
    title: string;
    views: number;
    slug: string;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    percentage: number;
  }>;
  contentStats: {
    publishedPosts: number;
    draftPosts: number;
    scheduledPosts: number;
    totalComments: number;
  };
  performanceMetrics: {
    avgLoadTime: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
}

const DashboardAnalytics: React.FC = () => {
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

  const StatCard = ({ title, value, icon: Icon, change, changeType }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={`text-sm flex items-center mt-1 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
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
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          icon={EyeIcon}
          change="+12.5%"
          changeType="positive"
        />
        <StatCard
          title="Published Posts"
          value={analytics.totalPosts}
          icon={DocumentTextIcon}
          change="+3"
          changeType="positive"
        />
        <StatCard
          title="Active Projects"
          value={analytics.totalProjects}
          icon={ChartBarIcon}
          change="No change"
          changeType="neutral"
        />
        <StatCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={UserGroupIcon}
          change="+2"
          changeType="positive"
        />
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Posts */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Posts</h3>
          <div className="space-y-3">
            {analytics.popularPosts.map((post, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">/{post.slug}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {post.views}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {analytics.trafficSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {source.source}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                    {source.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Statistics */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{analytics.contentStats.publishedPosts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Published</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{analytics.contentStats.draftPosts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Drafts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics.contentStats.scheduledPosts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{analytics.contentStats.totalComments}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Load Time</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.performanceMetrics.avgLoadTime}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bounce Rate</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.performanceMetrics.bounceRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Session</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Math.floor(analytics.performanceMetrics.avgSessionDuration / 60)}m {analytics.performanceMetrics.avgSessionDuration % 60}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics; 