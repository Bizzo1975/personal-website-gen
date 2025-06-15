'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Newsletter } from '@/types/newsletter';

const NewslettersPage: React.FC = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockNewsletters: Newsletter[] = [
        {
          id: '1',
          title: 'Weekly Web Dev Digest #47',
          slug: 'weekly-digest-47',
          subject: 'Advanced React Patterns & Next.js 14 Updates',
          previewText: 'This week: React patterns, Next.js updates, and performance tips',
          content: 'Newsletter content here...',
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
          content: 'Announcement content here...',
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
        },
        {
          id: '3',
          title: 'Personal Update: Year in Review',
          slug: 'personal-year-review',
          subject: 'Reflecting on 2024 - A Personal Journey',
          previewText: 'A personal reflection on the year and what lies ahead',
          content: 'Personal content here...',
          htmlContent: '',
          plainTextContent: '',
          status: 'draft',
          type: 'regular',
          permissions: {
            level: 'personal',
            allowedRoles: ['admin'],
            allowedUsers: ['close-friend@email.com'],
            restrictedUsers: [],
            requiresAuth: true,
            customRules: []
          },
          template: 'basic',
          author: 'admin',
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-13')
        }
      ];

      setNewsletters(mockNewsletters);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNewsletters = newsletters.filter(newsletter => {
    const matchesSearch = newsletter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         newsletter.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || newsletter.status === statusFilter;
    const matchesType = typeFilter === 'all' || newsletter.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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

  const getPermissionLevelColor = (level: string) => {
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

  const handleDeleteNewsletter = (newsletterId: string) => {
    if (confirm('Are you sure you want to delete this newsletter?')) {
      setNewsletters(prev => prev.filter(n => n.id !== newsletterId));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
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
            Newsletters
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your newsletter campaigns
          </p>
        </div>
        <Link
          href="/admin/newsletter/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Newsletter
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Newsletters</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{newsletters.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {newsletters.filter(n => n.status === 'sent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {newsletters.filter(n => n.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drafts</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {newsletters.filter(n => n.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Newsletters
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or subject..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="regular">Regular</option>
              <option value="blog_digest">Blog Digest</option>
              <option value="announcement">Announcement</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Newsletter List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Newsletter Campaigns ({filteredNewsletters.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredNewsletters.map((newsletter) => (
            <div key={newsletter.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {newsletter.title}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(newsletter.status)}`}>
                      {getStatusIcon(newsletter.status)}
                      <span className="ml-1 capitalize">{newsletter.status}</span>
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPermissionLevelColor(newsletter.permissions.level)}`}>
                      {newsletter.permissions.level}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Subject:</strong> {newsletter.subject}
                  </p>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {newsletter.previewText}
                  </p>

                  <div className="flex items-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
                    <span>Type: <span className="capitalize">{newsletter.type.replace('_', ' ')}</span></span>
                    <span>Template: {newsletter.template}</span>
                    <span>Created: {formatDate(newsletter.createdAt)}</span>
                    {newsletter.sentAt && (
                      <span>Sent: {formatDate(newsletter.sentAt)}</span>
                    )}
                    {newsletter.scheduledAt && (
                      <span>Scheduled: {formatDate(newsletter.scheduledAt)}</span>
                    )}
                    {newsletter.stats && (
                      <span>Open Rate: {newsletter.stats.openRate.toFixed(1)}%</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/admin/newsletter/newsletters/${newsletter.id}`}
                    className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    title="View Newsletter"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                  <Link
                    href={`/admin/newsletter/newsletters/${newsletter.id}/edit`}
                    className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                    title="Edit Newsletter"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteNewsletter(newsletter.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Delete Newsletter"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNewsletters.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No newsletters found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by creating your first newsletter'
              }
            </p>
            <Link
              href="/admin/newsletter/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Newsletter
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewslettersPage; 