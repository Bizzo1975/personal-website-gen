'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'active' | 'pending' | 'unsubscribed' | 'bounced';
  accessLevel: 'personal' | 'professional' | 'all';
  userRole?: string;
  interests: string[];
  source: string;
  subscribedAt: Date;
  confirmedAt?: Date;
  lastEmailSent?: Date;
  openRate: number;
  clickRate: number;
  totalEmailsReceived: number;
  tags: string[];
}

const SubscribersPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accessLevelFilter, setAccessLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockSubscribers: Subscriber[] = [
        {
          id: '1',
          email: 'john.developer@email.com',
          firstName: 'John',
          lastName: 'Developer',
          status: 'active',
          accessLevel: 'all',
          userRole: 'subscriber',
          interests: ['React', 'Next.js', 'TypeScript', 'Performance'],
          source: 'blog',
          subscribedAt: new Date('2024-01-14'),
          confirmedAt: new Date('2024-01-14'),
          lastEmailSent: new Date('2024-01-15'),
          openRate: 75.0,
          clickRate: 25.0,
          totalEmailsReceived: 8,
          tags: ['developer', 'frontend', 'engaged']
        },
        {
          id: '2',
          email: 'sarah.designer@agency.com',
          firstName: 'Sarah',
          lastName: 'Designer',
          status: 'active',
          accessLevel: 'professional',
          userRole: 'author',
          interests: ['UI/UX Design', 'React', 'Design Systems'],
          source: 'newsletter_signup',
          subscribedAt: new Date('2024-01-10'),
          confirmedAt: new Date('2024-01-10'),
          lastEmailSent: new Date('2024-01-15'),
          openRate: 80.0,
          clickRate: 30.0,
          totalEmailsReceived: 12,
          tags: ['designer', 'professional', 'high-engagement']
        },
        {
          id: '3',
          email: 'mike.student@university.edu',
          firstName: 'Mike',
          status: 'active',
          accessLevel: 'all',
          interests: ['JavaScript', 'Learning', 'Tutorials'],
          source: 'social_media',
          subscribedAt: new Date('2024-01-08'),
          confirmedAt: new Date('2024-01-08'),
          openRate: 60.0,
          clickRate: 15.0,
          totalEmailsReceived: 15,
          tags: ['student', 'beginner']
        },
        {
          id: '4',
          email: 'jane.cto@startup.com',
          firstName: 'Jane',
          lastName: 'Smith',
          status: 'active',
          accessLevel: 'personal',
          userRole: 'admin',
          interests: ['Leadership', 'Technology Strategy', 'React', 'DevOps'],
          source: 'referral',
          subscribedAt: new Date('2023-12-15'),
          confirmedAt: new Date('2023-12-15'),
          lastEmailSent: new Date('2024-01-13'),
          openRate: 90.0,
          clickRate: 40.0,
          totalEmailsReceived: 25,
          tags: ['vip', 'leader', 'long-term']
        },
        {
          id: '5',
          email: 'unconfirmed@email.com',
          status: 'pending',
          accessLevel: 'all',
          interests: [],
          source: 'blog',
          subscribedAt: new Date('2024-01-16'),
          openRate: 0,
          clickRate: 0,
          totalEmailsReceived: 0,
          tags: ['new', 'unconfirmed']
        }
      ];

      setSubscribers(mockSubscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscriber.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscriber.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter;
    const matchesAccessLevel = accessLevelFilter === 'all' || subscriber.accessLevel === accessLevelFilter;
    const matchesSource = sourceFilter === 'all' || subscriber.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesAccessLevel && matchesSource;
  });

  const getStatusColor = (status: Subscriber['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unsubscribed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'bounced':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAccessLevelColor = (level: Subscriber['accessLevel']) => {
    switch (level) {
      case 'personal':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'professional':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'all':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleSelectSubscriber = (subscriberId: string) => {
    setSelectedSubscribers(prev => {
      if (prev.includes(subscriberId)) {
        return prev.filter(id => id !== subscriberId);
      } else {
        return [...prev, subscriberId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(s => s.id));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on subscribers:`, selectedSubscribers);
    // Implement bulk actions
    setSelectedSubscribers([]);
    setShowBulkActions(false);
  };

  const handleExport = () => {
    console.log('Exporting subscribers');
    // Implement export functionality
  };

  useEffect(() => {
    setShowBulkActions(selectedSubscribers.length > 0);
  }, [selectedSubscribers]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Newsletter Subscribers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your newsletter subscribers and audience segments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">2,847</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subscribers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Subscriber management interface will be displayed here.
        </p>
      </div>
    </div>
  );
};

export default SubscribersPage; 