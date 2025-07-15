'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  CalendarIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';

interface NewsletterCampaign {
  id: string;
  title: string;
  slug: string;
  subject: string;
  preview_text: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
  type: 'manual' | 'automated' | 'welcome' | 'announcement';
  scheduled_send_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  author: string;
  created_at: string;
  updated_at: string;
  template_name: string | null;
}

const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/newsletter/campaigns?limit=50');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } else {
        setError('Failed to fetch campaigns');
      }
    } catch (err) {
      setError('Error loading campaigns');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'sending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <AdminLayout title="Newsletter Campaigns">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Newsletter Campaigns">
        <div className="p-6">
          <Card>
            <CardBody className="text-center py-12">
              <div className="text-red-500 mb-4">
                <CalendarIcon className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Error Loading Campaigns
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={fetchCampaigns} variant="primary">
                Try Again
              </Button>
            </CardBody>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Newsletter Campaigns">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => window.location.href = '/admin/content-management?tab=newsletter-campaigns'}
              className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Content Management
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Newsletter Campaigns
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Schedule and manage your newsletter distribution campaigns
            </p>
          </div>
          <Link
            href="/admin/newsletter/campaigns/create"
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Campaign
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="sent">Sent</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="manual">Manual</option>
                  <option value="automated">Automated</option>
                  <option value="welcome">Welcome</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Campaigns List */}
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {campaigns.length === 0 ? 'No campaigns found' : 'No campaigns match your filters'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {campaigns.length === 0 
                  ? 'Create your first newsletter campaign to get started'
                  : 'Try adjusting your search criteria or filters'
                }
              </p>
              {campaigns.length === 0 && (
                <Link
                  href="/admin/newsletter/campaigns/create"
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Campaign
                </Link>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {campaign.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded capitalize">
                          {campaign.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        <strong>Subject:</strong> {campaign.subject}
                      </p>
                      
                      {campaign.preview_text && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {campaign.preview_text}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <span>Author: {campaign.author}</span>
                        <span>Recipients: {campaign.recipient_count}</span>
                        <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                        {campaign.scheduled_send_at && (
                          <span>Scheduled: {new Date(campaign.scheduled_send_at).toLocaleString()}</span>
                        )}
                        {campaign.sent_at && (
                          <span>Sent: {new Date(campaign.sent_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/newsletter/campaigns/${campaign.id}/preview`}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/newsletter/campaigns/${campaign.id}/edit`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete "${campaign.title}"?`)) {
                            try {
                              const response = await fetch(`/api/admin/newsletter/campaigns/${campaign.id}`, {
                                method: 'DELETE',
                              });
                              
                              if (response.ok) {
                                // Refresh the campaigns list
                                fetchCampaigns();
                              } else {
                                const error = await response.json();
                                alert(`Failed to delete campaign: ${error.error}`);
                              }
                            } catch (error) {
                              console.error('Error deleting campaign:', error);
                              alert('Failed to delete campaign. Please try again.');
                            }
                          }
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CampaignsPage; 