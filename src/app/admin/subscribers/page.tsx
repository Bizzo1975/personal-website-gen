'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  EnvelopeIcon, 
  TagIcon, 
  UserPlusIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  Squares2X2Icon,
  ListBulletIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  CogIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import Button from '@/components/Button';
import Card, { CardHeader, CardBody } from '@/components/Card';
import { AdminInput, AdminSelect, AdminTextarea } from '../components/AdminFormField';

// Enhanced subscriber interface with all requested fields
interface Subscriber {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  interests: string[];
  subscription_source: string;
  subscription_date: string;
  is_active: boolean;
  is_confirmed: boolean;
  unsubscribed_at?: string;
  unsubscribe_reason?: string;
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'digest_only';
    content_types: string[];
    language: string;
    format: 'html' | 'text' | 'both';
  };
  metadata: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    location?: {
      country?: string;
      city?: string;
      region?: string;
    };
  };
  analytics: {
    total_emails_sent: number;
    total_emails_opened: number;
    total_clicks: number;
    open_rate: number;
    click_rate: number;
    last_email_sent?: string;
    last_email_opened?: string;
    last_activity?: string;
  };
  tags: string[];
  gdpr_consent: boolean;
  gdpr_consent_date?: string;
  data_retention_date?: string;
  created_at: string;
  updated_at: string;
}

// Analytics interface
interface SubscriberAnalytics {
  total_subscribers: number;
  active_subscribers: number;
  inactive_subscribers: number;
  confirmed_subscribers: number;
  pending_subscribers: number;
  unsubscribed_subscribers: number;
  bounced_subscribers: number;
  growth_rate: number;
  churn_rate: number;
  average_open_rate: number;
  average_click_rate: number;
  subscription_sources: { [key: string]: number };
  geographic_distribution: { [key: string]: number };
  device_breakdown: { [key: string]: number };
  content_preferences: { [key: string]: number };
  engagement_trends: {
    date: string;
    new_subscribers: number;
    unsubscribes: number;
    opens: number;
    clicks: number;
  }[];
  top_interests: { [key: string]: number };
  gdpr_compliance: {
    consented: number;
    pending_consent: number;
    expired_consent: number;
  };
}

// Filter interface
interface FilterState {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'unsubscribed' | 'bounced' | 'pending';
  source: string;
  date_range: '7d' | '30d' | '90d' | '1y' | 'all';
  interests: string[];
  gdpr_consent: 'all' | 'consented' | 'pending' | 'expired';
  engagement: 'all' | 'high' | 'medium' | 'low' | 'inactive';
  location: string;
}

export default function SubscriberManagementPage() {
  const router = useRouter();
  
  // State management
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [analytics, setAnalytics] = useState<SubscriberAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View and filter states
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'analytics' | 'campaigns' | 'privacy'>('overview');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    source: '',
    date_range: '30d',
    interests: [],
    gdpr_consent: 'all',
    engagement: 'all',
    location: ''
  });
  
  // Modal and selection states
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  
  // Available options for filters
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchSubscribers();
    fetchAnalytics();
    fetchFilterOptions();
  }, [currentPage, pageSize, filters]);

  // Fetch subscribers with filters
  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      // Convert filters to URLSearchParams-compatible format (all values must be strings)
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: filters.search || '',
        status: filters.status || 'all',
        source: filters.source || '',
        date_range: filters.date_range || '30d',
        interests: Array.isArray(filters.interests) ? filters.interests.join(',') : '',
        gdpr_consent: filters.gdpr_consent || 'all',
        engagement: filters.engagement || 'all',
        location: filters.location || ''
      };
      
      const queryParams = new URLSearchParams(params);
      
      const response = await fetch(`/api/admin/subscribers?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      
      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/subscribers/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/admin/subscribers/filter-options');
      if (!response.ok) throw new Error('Failed to fetch filter options');
      
      const data = await response.json();
      setAvailableInterests(data.interests || []);
      setAvailableSources(data.sources || []);
      setAvailableLocations(data.locations || []);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      source: '',
      date_range: '30d',
      interests: [],
      gdpr_consent: 'all',
      engagement: 'all',
      location: ''
    });
    setCurrentPage(1);
  };

  // Handle subscriber actions
  const handleAction = async (action: string, subscriber: Subscriber) => {
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriber.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`Failed to ${action} subscriber`);
      
      await fetchSubscribers();
      await fetchAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Delete subscriber
  const handleDelete = async (subscriber: Subscriber) => {
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriber.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete subscriber');
      
      await fetchSubscribers();
      await fetchAnalytics();
      setShowDeleteModal(false);
      setSelectedSubscriber(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Send targeted email
  const handleSendEmail = async (subscriber: Subscriber, emailData: any) => {
    try {
      const response = await fetch('/api/admin/subscribers/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriber_id: subscriber.id,
          ...emailData
        })
      });
      
      if (!response.ok) throw new Error('Failed to send email');
      
      setShowEmailModal(false);
      setSelectedSubscriber(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Get status color
  const getStatusColor = (subscriber: Subscriber) => {
    if (!subscriber.is_active) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (!subscriber.is_confirmed) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (subscriber.unsubscribed_at) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  // Get status text
  const getStatusText = (subscriber: Subscriber) => {
    if (!subscriber.is_active) return 'Inactive';
    if (!subscriber.is_confirmed) return 'Pending';
    if (subscriber.unsubscribed_at) return 'Unsubscribed';
    return 'Active';
  };

  // Get engagement level
  const getEngagementLevel = (subscriber: Subscriber) => {
    const openRate = subscriber.analytics.open_rate;
    if (openRate >= 50) return { level: 'High', color: 'text-green-600' };
    if (openRate >= 20) return { level: 'Medium', color: 'text-yellow-600' };
    if (openRate > 0) return { level: 'Low', color: 'text-orange-600' };
    return { level: 'Inactive', color: 'text-gray-600' };
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter subscribers based on current filters
  const filteredSubscribers = subscribers.filter(subscriber => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = (
        subscriber.email.toLowerCase().includes(searchTerm) ||
        subscriber.name?.toLowerCase().includes(searchTerm) ||
        subscriber.first_name?.toLowerCase().includes(searchTerm) ||
        subscriber.last_name?.toLowerCase().includes(searchTerm) ||
        subscriber.company?.toLowerCase().includes(searchTerm)
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      const subscriberStatus = getStatusText(subscriber).toLowerCase();
      if (subscriberStatus !== filters.status) return false;
    }

    // Source filter
    if (filters.source && subscriber.subscription_source !== filters.source) {
      return false;
    }

    // GDPR consent filter
    if (filters.gdpr_consent !== 'all') {
      if (filters.gdpr_consent === 'consented' && !subscriber.gdpr_consent) return false;
      if (filters.gdpr_consent === 'pending' && subscriber.gdpr_consent) return false;
      // Add expired consent logic here if needed
    }

    // Engagement filter
    if (filters.engagement !== 'all') {
      const engagement = getEngagementLevel(subscriber).level.toLowerCase();
      if (engagement !== filters.engagement) return false;
    }

    // Location filter
    if (filters.location && subscriber.metadata.location?.country !== filters.location) {
      return false;
    }

    return true;
  });

  return (
    <AdminLayout title="Subscriber Management">
      <AdminPageLayout 
        title="Subscriber Management"
        description="Manage newsletter subscribers, analyze engagement, and ensure privacy compliance"
      >
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'subscribers', label: 'Subscribers', icon: UserGroupIcon },
              { key: 'analytics', label: 'Analytics', icon: ArrowTrendingUpIcon },
              { key: 'campaigns', label: 'Campaigns', icon: EnvelopeIcon },
              { key: 'privacy', label: 'Privacy & Compliance', icon: ShieldCheckIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            analytics={analytics} 
            loading={loading} 
            onNavigate={(tab: string) => {
              const validTabs: ('overview' | 'subscribers' | 'analytics' | 'campaigns' | 'privacy')[] = ['overview', 'subscribers', 'analytics', 'campaigns', 'privacy'];
              if (validTabs.includes(tab as any)) {
                setActiveTab(tab as 'overview' | 'subscribers' | 'analytics' | 'campaigns' | 'privacy');
              }
            }}
          />
        )}

        {activeTab === 'subscribers' && (
          <SubscribersTab
            subscribers={filteredSubscribers}
            loading={loading}
            viewMode={viewMode}
            setViewMode={setViewMode}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            availableInterests={availableInterests}
            availableSources={availableSources}
            availableLocations={availableLocations}
            onAction={handleAction}
            onViewDetails={setSelectedSubscriber}
            onEdit={setSelectedSubscriber}
            onDelete={setSelectedSubscriber}
            onSendEmail={setSelectedSubscriber}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            getEngagementLevel={getEngagementLevel}
            formatDate={formatDate}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalPages={totalPages}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab 
            analytics={analytics} 
            loading={loading}
            subscribers={subscribers}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignsTab 
            subscribers={filteredSubscribers}
            onSendEmail={setSelectedSubscriber}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacyTab 
            subscribers={subscribers}
            analytics={analytics}
            onViewDetails={setSelectedSubscriber}
          />
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
} 

// Overview Tab Component
const OverviewTab = ({ analytics, loading, onNavigate }: {
  analytics: SubscriberAnalytics | null;
  loading: boolean;
  onNavigate: (tab: string) => void;
}) => {
  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Subscribers',
      value: analytics.total_subscribers.toLocaleString(),
      change: `+${analytics.growth_rate.toFixed(1)}%`,
      trend: analytics.growth_rate > 0 ? 'up' : 'down',
      icon: UserGroupIcon,
      color: 'text-blue-600',
      onClick: () => onNavigate('subscribers')
    },
    {
      title: 'Active Subscribers',
      value: analytics.active_subscribers.toLocaleString(),
      change: `${((analytics.active_subscribers / analytics.total_subscribers) * 100).toFixed(1)}%`,
      trend: 'up',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      onClick: () => onNavigate('subscribers')
    },
    {
      title: 'Average Open Rate',
      value: `${analytics.average_open_rate.toFixed(1)}%`,
      change: 'Industry avg: 21.3%',
      trend: analytics.average_open_rate > 21.3 ? 'up' : 'down',
      icon: EnvelopeIcon,
      color: 'text-purple-600',
      onClick: () => onNavigate('analytics')
    },
    {
      title: 'Average Click Rate',
      value: `${analytics.average_click_rate.toFixed(1)}%`,
      change: 'Industry avg: 2.6%',
      trend: analytics.average_click_rate > 2.6 ? 'up' : 'down',
      icon: ChartBarIcon,
      color: 'text-orange-600',
      onClick: () => onNavigate('analytics')
    },
    {
      title: 'GDPR Consented',
      value: analytics.gdpr_compliance.consented.toLocaleString(),
      change: `${((analytics.gdpr_compliance.consented / analytics.total_subscribers) * 100).toFixed(1)}%`,
      trend: 'up',
      icon: ShieldCheckIcon,
      color: 'text-green-600',
      onClick: () => onNavigate('privacy')
    },
    {
      title: 'Churn Rate',
      value: `${analytics.churn_rate.toFixed(1)}%`,
      change: `${analytics.churn_rate < 5 ? 'Low' : analytics.churn_rate < 10 ? 'Medium' : 'High'}`,
      trend: analytics.churn_rate < 5 ? 'up' : 'down',
      icon: ArrowTrendingDownIcon,
      color: 'text-red-600',
      onClick: () => onNavigate('analytics')
    },
    {
      title: 'Unsubscribed',
      value: analytics.unsubscribed_subscribers.toLocaleString(),
      change: `${((analytics.unsubscribed_subscribers / analytics.total_subscribers) * 100).toFixed(1)}%`,
      trend: 'down',
      icon: XCircleIcon,
      color: 'text-gray-600',
      onClick: () => onNavigate('subscribers')
    },
    {
      title: 'Pending Consent',
      value: analytics.gdpr_compliance.pending_consent.toLocaleString(),
      change: 'Requires action',
      trend: analytics.gdpr_compliance.pending_consent > 0 ? 'down' : 'up',
      icon: ClockIcon,
      color: 'text-yellow-600',
      onClick: () => onNavigate('privacy')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={stat.onClick}>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className={`text-sm flex items-center ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : stat.trend === 'down' ? (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    ) : null}
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('subscribers')}>
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Subscribers</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View, edit, and manage subscriber details</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('campaigns')}>
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <EnvelopeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Campaigns</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create and send targeted email campaigns</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('analytics')}>
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">View Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analyze subscriber engagement and trends</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {analytics.engagement_trends.slice(0, 5).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(trend.date)}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>+{trend.new_subscribers} subscribers</span>
                  <span>{trend.opens} opens</span>
                  <span>{trend.clicks} clicks</span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// Subscribers Tab Component
const SubscribersTab = ({ 
  subscribers, 
  loading, 
  viewMode, 
  setViewMode, 
  filters, 
  onFilterChange, 
  onClearFilters,
  availableInterests,
  availableSources,
  availableLocations,
  onAction,
  onViewDetails,
  onEdit,
  onDelete,
  onSendEmail,
  getStatusColor,
  getStatusText,
  getEngagementLevel,
  formatDate,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalPages
}: any) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subscribers..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </Button>

          {Object.values(filters).some(v => v !== 'all' && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) && (
            <Button variant="outline" onClick={onClearFilters} className="text-red-600 hover:text-red-700">
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-l-lg ${
                viewMode === 'table' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-r-lg ${
                viewMode === 'card' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </div>

          <Button variant="primary" onClick={() => onAction('add', null)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Subscriber
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AdminSelect
                id="filter-status"
                label="Status"
                value={filters.status}
                onChange={(e) => onFilterChange('status', e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'unsubscribed', label: 'Unsubscribed' }
                ]}
              />

              <AdminSelect
                id="filter-source"
                label="Source"
                value={filters.source}
                onChange={(e) => onFilterChange('source', e.target.value)}
                options={[
                  { value: '', label: 'All Sources' },
                  ...availableSources.map((source: string) => ({ value: source, label: source }))
                ]}
              />

              <AdminSelect
                id="filter-date-range"
                label="Date Range"
                value={filters.date_range}
                onChange={(e) => onFilterChange('date_range', e.target.value)}
                options={[
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: '90d', label: 'Last 90 Days' },
                  { value: '1y', label: 'Last Year' },
                  { value: 'all', label: 'All Time' }
                ]}
              />

              <AdminSelect
                id="filter-gdpr-consent"
                label="GDPR Consent"
                value={filters.gdpr_consent}
                onChange={(e) => onFilterChange('gdpr_consent', e.target.value)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'consented', label: 'Consented' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'expired', label: 'Expired' }
                ]}
              />

              <AdminSelect
                id="filter-engagement"
                label="Engagement"
                value={filters.engagement}
                onChange={(e) => onFilterChange('engagement', e.target.value)}
                options={[
                  { value: 'all', label: 'All Levels' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />

              <AdminSelect
                id="filter-location"
                label="Location"
                value={filters.location}
                onChange={(e) => onFilterChange('location', e.target.value)}
                options={[
                  { value: '', label: 'All Locations' },
                  ...availableLocations.map((location: string) => ({ value: location, label: location }))
                ]}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, subscribers.length)} of {subscribers.length} subscribers
        </span>
        <div className="flex items-center space-x-2">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading subscribers...</p>
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subscriber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    GDPR
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {subscribers.map((subscriber: Subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                              {subscriber.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {subscriber.name || subscriber.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {subscriber.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscriber)}`}>
                        {getStatusText(subscriber)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {subscriber.subscription_source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className={`font-medium ${getEngagementLevel(subscriber).color}`}>
                          {getEngagementLevel(subscriber).level}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {subscriber.analytics.open_rate.toFixed(1)}% open rate
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(subscriber.subscription_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {subscriber.gdpr_consent ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {subscriber.gdpr_consent ? 'Consented' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(subscriber)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(subscriber)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSendEmail(subscriber)}
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(subscriber)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Card View */}
      {!loading && viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscribers.map((subscriber: Subscriber) => (
            <Card key={subscriber.id} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium text-lg">
                          {subscriber.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {subscriber.name || subscriber.email}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {subscriber.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(subscriber)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(subscriber)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSendEmail(subscriber)}
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscriber)}`}>
                      {getStatusText(subscriber)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Source</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {subscriber.subscription_source}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Engagement</span>
                    <span className={`text-sm font-medium ${getEngagementLevel(subscriber).color}`}>
                      {getEngagementLevel(subscriber).level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Subscribed</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(subscriber.subscription_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">GDPR</span>
                    <div className="flex items-center">
                      {subscriber.gdpr_consent ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span className="ml-1 text-sm text-gray-900 dark:text-white">
                        {subscriber.gdpr_consent ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {subscriber.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {subscriber.interests.slice(0, 3).map((interest, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                      {subscriber.interests.length > 3 && (
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                          +{subscriber.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Empty State */}
      {!loading && subscribers.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No subscribers found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {Object.values(filters).some(v => v !== 'all' && v !== '' && (Array.isArray(v) ? v.length > 0 : true))
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first subscriber.'
            }
          </p>
          <Button variant="primary" onClick={() => onAction('add', null)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Subscriber
          </Button>
        </div>
      )}
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ analytics, loading, subscribers }: {
  analytics: SubscriberAnalytics | null;
  loading: boolean;
  subscribers: Subscriber[];
}) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('subscribers');

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h3>
        <AdminSelect
          id="analytics-time-range"
          label="Time Range"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
            { value: '1y', label: 'Last Year' }
          ]}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedMetric('subscribers')}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Subscribers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.total_subscribers.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  +{analytics.growth_rate.toFixed(1)}% growth
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedMetric('engagement')}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.average_open_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Industry: 21.3%</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <EnvelopeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedMetric('clicks')}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Click Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.average_click_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Industry: 2.6%</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedMetric('churn')}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.churn_rate.toFixed(1)}%</p>
                <p className={`text-sm flex items-center ${analytics.churn_rate < 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.churn_rate < 5 ? 'Healthy' : 'Needs attention'}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Sources */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Sources</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Object.entries(analytics.subscription_sources).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-900 dark:text-white capitalize">{source}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{count}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({((count / analytics.total_subscribers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Geographic Distribution</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Object.entries(analytics.geographic_distribution).slice(0, 5).map(([country, count]) => (
                <div key={country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">{country}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{count}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({((count / analytics.total_subscribers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Engagement Trends */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Engagement Trends</h3>
        </CardHeader>
        <CardBody>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
              <p>Chart visualization would go here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Device and Content Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Device Breakdown</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Object.entries(analytics.device_breakdown).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {device === 'mobile' ? (
                      <DevicePhoneMobileIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ComputerDesktopIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm text-gray-900 dark:text-white capitalize">{device}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{count}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({((count / analytics.total_subscribers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Interests</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Object.entries(analytics.top_interests).slice(0, 5).map(([interest, count]) => (
                <div key={interest} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TagIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">{interest}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{count}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({((count / analytics.total_subscribers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

// Campaigns Tab Component
const CampaignsTab = ({ subscribers, onSendEmail }: {
  subscribers: Subscriber[];
  onSendEmail: (subscriber: Subscriber) => void;
}) => {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [campaignData, setCampaignData] = useState({
    subject: '',
    content: '',
    template: '',
    schedule: ''
  });

  const segments = [
    { value: 'all', label: 'All Subscribers', count: subscribers.length },
    { value: 'active', label: 'Active Only', count: subscribers.filter(s => s.is_active).length },
    { value: 'high_engagement', label: 'High Engagement', count: subscribers.filter(s => s.analytics.open_rate > 50).length },
    { value: 'new', label: 'New Subscribers', count: subscribers.filter(s => 
      new Date(s.subscription_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Campaigns</h3>
        <Button variant="primary" onClick={() => window.location.href = '/admin/newsletter/campaigns/create'}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Quick Send */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Send</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <AdminSelect
            id="campaign-target-segment"
            label="Target Segment"
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            options={segments.map(seg => ({ 
              value: seg.value, 
              label: `${seg.label} (${seg.count} subscribers)` 
            }))}
          />

          <AdminInput
            id="campaign-subject"
            label="Subject Line"
            value={campaignData.subject}
            onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Enter email subject..."
          />

          <AdminTextarea
            id="campaign-content"
            label="Email Content"
            value={campaignData.content}
            onChange={(e) => setCampaignData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Enter email content..."
            rows={6}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This will send to {segments.find(s => s.value === selectedSegment)?.count || 0} subscribers
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                Save as Draft
              </Button>
              <Button variant="primary">
                Send Now
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Campaign Templates */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Templates</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Welcome Series', description: 'Automated welcome email for new subscribers' },
              { name: 'Newsletter Digest', description: 'Monthly newsletter with latest content' },
              { name: 'Product Announcement', description: 'Announce new features or products' },
              { name: 'Re-engagement', description: 'Win back inactive subscribers' }
            ].map((template, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                <Button size="sm" variant="outline">
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Campaigns</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <EnvelopeIcon className="h-12 w-12 mx-auto mb-4" />
            <p>No recent campaigns</p>
            <p className="text-sm">Create your first campaign to see it here</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// Privacy Tab Component
const PrivacyTab = ({ subscribers, analytics, onViewDetails }: {
  subscribers: Subscriber[];
  analytics: SubscriberAnalytics | null;
  onViewDetails: (subscriber: Subscriber) => void;
}) => {
  const [selectedCompliance, setSelectedCompliance] = useState('all');

  const gdprStats = analytics?.gdpr_compliance || {
    consented: 0,
    pending_consent: 0,
    expired_consent: 0
  };

  const complianceFilters = [
    { value: 'all', label: 'All Subscribers', count: subscribers.length },
    { value: 'consented', label: 'GDPR Consented', count: gdprStats.consented },
    { value: 'pending', label: 'Pending Consent', count: gdprStats.pending_consent },
    { value: 'expired', label: 'Expired Consent', count: gdprStats.expired_consent }
  ];

  const filteredSubscribers = subscribers.filter(subscriber => {
    if (selectedCompliance === 'all') return true;
    if (selectedCompliance === 'consented') return subscriber.gdpr_consent;
    if (selectedCompliance === 'pending') return !subscriber.gdpr_consent;
    if (selectedCompliance === 'expired') return subscriber.data_retention_date && new Date(subscriber.data_retention_date) < new Date();
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Compliance</h3>
        <Button variant="primary">
          <ShieldCheckIcon className="h-4 w-4 mr-2" />
          Compliance Report
        </Button>
      </div>

      {/* GDPR Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">GDPR Consented</p>
                <p className="text-2xl font-bold text-green-600">{gdprStats.consented}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {((gdprStats.consented / subscribers.length) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Consent</p>
                <p className="text-2xl font-bold text-yellow-600">{gdprStats.pending_consent}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {((gdprStats.pending_consent / subscribers.length) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired Consent</p>
                <p className="text-2xl font-bold text-red-600">{gdprStats.expired_consent}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {((gdprStats.expired_consent / subscribers.length) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Compliance Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Actions</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center justify-center p-4">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Send Consent Request
            </Button>
            <Button variant="outline" className="flex items-center justify-center p-4">
              <TrashIcon className="h-5 w-5 mr-2" />
              Data Retention Cleanup
            </Button>
            <Button variant="outline" className="flex items-center justify-center p-4">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Privacy Policy Update
            </Button>
            <Button variant="outline" className="flex items-center justify-center p-4">
              <CogIcon className="h-5 w-5 mr-2" />
              Compliance Settings
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Compliance Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscriber Compliance Status</h3>
            <AdminSelect
              id="privacy-compliance-filter"
              label="Compliance Status"
              value={selectedCompliance}
              onChange={(e) => setSelectedCompliance(e.target.value)}
              options={complianceFilters.map(filter => ({
                value: filter.value,
                label: `${filter.label} (${filter.count})`
              }))}
            />
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {filteredSubscribers.slice(0, 10).map((subscriber: Subscriber) => (
              <div key={subscriber.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        {subscriber.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscriber.name || subscriber.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {subscriber.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {subscriber.gdpr_consent ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {subscriber.gdpr_consent ? 'Consented' : 'Pending'}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onViewDetails(subscriber)}>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}; 