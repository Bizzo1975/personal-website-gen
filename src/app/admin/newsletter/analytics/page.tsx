'use client';

import React, { useState } from 'react';
import {
  ChartBarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  UserMinusIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const AnalyticsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days');

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalNewsletters: 24,
      totalCampaigns: 18,
      totalSubscribers: 2847,
      activeSubscribers: 2683,
      averageOpenRate: 58.2,
      averageClickRate: 16.7,
      averageUnsubscribeRate: 0.4,
      averageBounceRate: 0.3
    },
    growth: {
      newSubscribers: 47,
      unsubscribes: 12,
      netGrowth: 35,
      growthRate: 1.3
    },
    topPerformingNewsletters: [
      {
        id: '1',
        title: 'Weekly Web Dev Digest #47',
        openRate: 65.2,
        clickRate: 22.1,
        sentAt: new Date('2024-01-15')
      },
      {
        id: '2',
        title: 'React 18 Features Deep Dive',
        openRate: 62.8,
        clickRate: 19.5,
        sentAt: new Date('2024-01-08')
      },
      {
        id: '3',
        title: 'TypeScript Best Practices 2024',
        openRate: 59.1,
        clickRate: 18.3,
        sentAt: new Date('2024-01-01')
      }
    ],
    audienceBreakdown: {
      byPermissionLevel: {
        all: 2456,
        professional: 312,
        personal: 79
      },
      byUserRole: {
        subscriber: 2456,
        author: 312,
        editor: 58,
        admin: 21
      },
      bySource: {
        blog: 1523,
        newsletter_signup: 842,
        social_media: 312,
        referral: 170
      }
    }
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const getTrendIcon = (isPositive: boolean) => {
    return isPositive ? (
      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Newsletter Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track performance and engagement metrics for your newsletter campaigns
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="last_7_days">Last 7 days</option>
          <option value="last_30_days">Last 30 days</option>
          <option value="last_90_days">Last 90 days</option>
          <option value="all_time">All time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Open Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatPercent(analyticsData.overview.averageOpenRate)}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(true)}
            <span className="text-sm text-green-600 ml-1">+2.1% from last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Click Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatPercent(analyticsData.overview.averageClickRate)}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CursorArrowRaysIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(true)}
            <span className="text-sm text-green-600 ml-1">+0.8% from last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unsubscribe Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatPercent(analyticsData.overview.averageUnsubscribeRate)}
              </p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <UserMinusIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(false)}
            <span className="text-sm text-red-600 ml-1">+0.1% from last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bounce Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatPercent(analyticsData.overview.averageBounceRate)}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(true)}
            <span className="text-sm text-green-600 ml-1">-0.2% from last period</span>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Subscriber Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscriber Growth</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">New Subscribers</span>
              <span className="text-sm font-medium text-green-600">{analyticsData.growth.newSubscribers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Unsubscribes</span>
              <span className="text-sm font-medium text-red-600">{analyticsData.growth.unsubscribes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-weight text-gray-900 dark:text-white">Net Growth</span>
              <span className="text-sm font-medium text-blue-600">{analyticsData.growth.netGrowth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatPercent(analyticsData.growth.growthRate)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Performing Newsletters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Newsletters</h3>
          <div className="space-y-4">
            {analyticsData.topPerformingNewsletters.map((newsletter, index) => (
              <div key={newsletter.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-4">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white ml-2 truncate">
                      {newsletter.title}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                    {new Intl.DateTimeFormat('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    }).format(newsletter.sentAt)}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPercent(newsletter.openRate)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatPercent(newsletter.clickRate)} CTR
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* By Permission Level */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By Permission Level</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.audienceBreakdown.byPermissionLevel).map(([level, count]) => {
              const percentage = (count / analyticsData.overview.totalSubscribers) * 100;
              return (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      level === 'all' ? 'bg-green-500' :
                      level === 'professional' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-900 dark:text-white capitalize">{level}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(count)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPercent(percentage)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By User Role */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By User Role</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.audienceBreakdown.byUserRole).map(([role, count]) => {
              const percentage = (count / analyticsData.overview.totalSubscribers) * 100;
              return (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      role === 'subscriber' ? 'bg-blue-500' :
                      role === 'author' ? 'bg-green-500' :
                      role === 'editor' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-900 dark:text-white capitalize">{role}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(count)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPercent(percentage)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Source */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By Source</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.audienceBreakdown.bySource).map(([source, count]) => {
              const percentage = (count / analyticsData.overview.totalSubscribers) * 100;
              return (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      source === 'blog' ? 'bg-blue-500' :
                      source === 'newsletter_signup' ? 'bg-green-500' :
                      source === 'social_media' ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="text-sm text-gray-900 dark:text-white capitalize">
                      {source.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(count)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPercent(percentage)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 