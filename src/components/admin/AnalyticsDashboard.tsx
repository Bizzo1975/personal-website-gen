'use client';

import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '@/components/AccessibilityEnhancements';

interface AnalyticsData {
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    conversionRate: number;
    totalConversions: number;
  };
  contentPerformance: {
    id: string;
    title: string;
    type: 'post' | 'page' | 'project';
    views: number;
    engagement: number;
    shares: number;
    avgTimeOnPage: number;
    bounceRate: number;
  }[];
  userEngagement: {
    date: string;
    pageViews: number;
    sessions: number;
    users: number;
    newUsers: number;
  }[];
  trafficSources: {
    source: string;
    sessions: number;
    percentage: number;
    conversionRate: number;
  }[];
  topPerformers: {
    content: {
      title: string;
      views: number;
      engagement: number;
    }[];
    referrers: {
      source: string;
      visits: number;
    }[];
  };
  conversions: {
    goal: string;
    conversions: number;
    conversionRate: number;
    value: number;
  }[];
}

interface AnalyticsDashboardProps {
  dateRange?: 'today' | '7days' | '30days' | '90days';
  onDateRangeChange?: (range: string) => void;
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  dateRange = '30days',
  onDateRangeChange,
  className = ''
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'engagement' | 'conversions'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('views');

  // Mock data - in a real app, this would come from analytics APIs
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        overview: {
          totalViews: 45678,
          uniqueVisitors: 28456,
          bounceRate: 32.5,
          avgSessionDuration: 245,
          conversionRate: 3.2,
          totalConversions: 145
        },
        contentPerformance: [
          {
            id: '1',
            title: 'Getting Started with React Hooks',
            type: 'post',
            views: 12345,
            engagement: 87.5,
            shares: 234,
            avgTimeOnPage: 325,
            bounceRate: 25.3
          },
          {
            id: '2',
            title: 'Advanced TypeScript Patterns',
            type: 'post',
            views: 8765,
            engagement: 92.1,
            shares: 189,
            avgTimeOnPage: 412,
            bounceRate: 18.7
          },
          {
            id: '3',
            title: 'Project: E-commerce Platform',
            type: 'project',
            views: 6543,
            engagement: 94.2,
            shares: 156,
            avgTimeOnPage: 567,
            bounceRate: 15.2
          },
          {
            id: '4',
            title: 'About Me',
            type: 'page',
            views: 4321,
            engagement: 76.8,
            shares: 45,
            avgTimeOnPage: 198,
            bounceRate: 35.6
          }
        ],
        userEngagement: [
          { date: '2024-01-01', pageViews: 1234, sessions: 987, users: 756, newUsers: 234 },
          { date: '2024-01-02', pageViews: 1456, sessions: 1123, users: 845, newUsers: 267 },
          { date: '2024-01-03', pageViews: 1678, sessions: 1234, users: 923, newUsers: 198 },
          { date: '2024-01-04', pageViews: 1543, sessions: 1187, users: 887, newUsers: 245 },
          { date: '2024-01-05', pageViews: 1789, sessions: 1345, users: 1023, newUsers: 312 },
          { date: '2024-01-06', pageViews: 1432, sessions: 1098, users: 823, newUsers: 189 },
          { date: '2024-01-07', pageViews: 1567, sessions: 1211, users: 945, newUsers: 223 }
        ],
        trafficSources: [
          { source: 'Organic Search', sessions: 15234, percentage: 45.2, conversionRate: 4.1 },
          { source: 'Direct', sessions: 8765, percentage: 26.0, conversionRate: 5.2 },
          { source: 'Social Media', sessions: 4321, percentage: 12.8, conversionRate: 2.3 },
          { source: 'Referral', sessions: 3456, percentage: 10.3, conversionRate: 3.7 },
          { source: 'Email', sessions: 1234, percentage: 3.7, conversionRate: 6.8 },
          { source: 'Paid Search', sessions: 678, percentage: 2.0, conversionRate: 3.1 }
        ],
        topPerformers: {
          content: [
            { title: 'React Hooks Guide', views: 12345, engagement: 87.5 },
            { title: 'TypeScript Patterns', views: 8765, engagement: 92.1 },
            { title: 'E-commerce Project', views: 6543, engagement: 94.2 }
          ],
          referrers: [
            { source: 'google.com', visits: 8765 },
            { source: 'twitter.com', visits: 2345 },
            { source: 'linkedin.com', visits: 1234 }
          ]
        },
        conversions: [
          { goal: 'Contact Form Submission', conversions: 89, conversionRate: 2.1, value: 4450 },
          { goal: 'Newsletter Signup', conversions: 134, conversionRate: 3.2, value: 0 },
          { goal: 'Project Inquiry', conversions: 45, conversionRate: 1.1, value: 2250 },
          { goal: 'Social Media Follow', conversions: 267, conversionRate: 6.3, value: 0 }
        ]
      };
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    };

    fetchAnalyticsData();
  }, [dateRange]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <span className={`flex items-center gap-1 text-sm ${
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        <svg className={`w-4 h-4 ${isPositive ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l9-9 3 3L7 20l-3-3z" />
        </svg>
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Track your content performance and user engagement
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange?.(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
            
            <AccessibleButton
              onClick={() => window.open('/api/analytics/export', '_blank')}
              variant="secondary"
              size="sm"
            >
              Export Data
            </AccessibleButton>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'content', label: 'Content' },
            { id: 'engagement', label: 'Engagement' },
            { id: 'conversions', label: 'Conversions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Views</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatNumber(analyticsData.overview.totalViews)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                {getChangeIndicator(analyticsData.overview.totalViews, 35234)}
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Unique Visitors</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatNumber(analyticsData.overview.uniqueVisitors)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                {getChangeIndicator(analyticsData.overview.uniqueVisitors, 23451)}
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Bounce Rate</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatPercentage(analyticsData.overview.bounceRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </div>
                </div>
                {getChangeIndicator(32.5, 38.2)}
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Session</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatDuration(analyticsData.overview.avgSessionDuration)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {getChangeIndicator(245, 198)}
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Conversion Rate</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatPercentage(analyticsData.overview.conversionRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                {getChangeIndicator(3.2, 2.8)}
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Conversions</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {analyticsData.overview.totalConversions}
                    </p>
                  </div>
                  <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-full">
                    <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                {getChangeIndicator(145, 123)}
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                Traffic Sources
              </h3>
              <div className="space-y-3">
                {analyticsData.trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {source.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatNumber(source.sessions)} sessions
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatPercentage(source.percentage)}
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {formatPercentage(source.conversionRate)} CR
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                Content Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                      <th className="pb-3">Content</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Views</th>
                      <th className="pb-3">Engagement</th>
                      <th className="pb-3">Shares</th>
                      <th className="pb-3">Time on Page</th>
                      <th className="pb-3">Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {analyticsData.contentPerformance.map((content, index) => (
                      <tr key={content.id} className="border-t border-slate-200 dark:border-slate-600">
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                          {content.title}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-400">
                          <span className="px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded-full text-xs">
                            {content.type}
                          </span>
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-100">
                          {formatNumber(content.views)}
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-100">
                          {formatPercentage(content.engagement)}
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-100">
                          {content.shares}
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-100">
                          {formatDuration(content.avgTimeOnPage)}
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-100">
                          {formatPercentage(content.bounceRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                User Engagement Trends
              </h3>
              <div className="space-y-4">
                {analyticsData.userEngagement.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-600 rounded-lg">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Views: <span className="font-medium text-slate-900 dark:text-slate-100">{formatNumber(day.pageViews)}</span>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        Sessions: <span className="font-medium text-slate-900 dark:text-slate-100">{formatNumber(day.sessions)}</span>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        Users: <span className="font-medium text-slate-900 dark:text-slate-100">{formatNumber(day.users)}</span>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        New: <span className="font-medium text-slate-900 dark:text-slate-100">{formatNumber(day.newUsers)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conversions' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                Conversion Goals
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticsData.conversions.map((conversion, index) => (
                  <div key={index} className="bg-white dark:bg-slate-600 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {conversion.goal}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Conversions:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {conversion.conversions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Rate:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {formatPercentage(conversion.conversionRate)}
                        </span>
                      </div>
                      {conversion.value > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Value:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            ${conversion.value}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 