'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';

interface CampaignData {
  id: string;
  title: string;
  subject: string;
  preview_text: string;
  content: string;
  html_content: string;
  plain_text_content: string;
  template_id: string;
  template_name: string;
  type: 'manual' | 'automated' | 'welcome' | 'announcement';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
  scheduled_send_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  author: string;
  created_at: string;
  updated_at: string;
  target_access_levels: string[];
  permissions: {
    level: string;
    allowedRoles: string[];
    allowedUsers: string[];
    restrictedUsers: string[];
    requiresAuth: boolean;
  };
}

const PreviewCampaignPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/admin/newsletter/campaigns/${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        setCampaign(data.campaign);
      } else {
        setError('Failed to load campaign');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setError('Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToContentManagement = () => {
    router.push('/admin/content-management?tab=newsletter-campaigns');
  };

  const handleEditCampaign = () => {
    router.push(`/admin/newsletter/campaigns/${campaignId}/edit`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <AdminLayout title="Campaign Preview">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !campaign) {
    return (
      <AdminLayout title="Campaign Preview">
        <div className="p-6">
          <Card>
            <CardBody className="text-center py-12">
              <div className="text-red-500 mb-4">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Error Loading Campaign
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'Campaign not found'}
              </p>
              <Button onClick={handleBackToContentManagement} variant="primary">
                Back to Content Management
              </Button>
            </CardBody>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Campaign Preview">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToContentManagement}
                  className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Content Management
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Status Badge */}
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
                
                {/* Action Buttons */}
                <Button
                  variant="outline"
                  onClick={handleEditCampaign}
                  disabled={campaign.status === 'sent' || campaign.status === 'sending'}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Campaign
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {campaign.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Campaign Preview
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaign Info Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Campaign Details
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Campaign Title
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{campaign.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Subject
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{campaign.subject}</p>
                  </div>
                  
                  {campaign.preview_text && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preview Text
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{campaign.preview_text}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Campaign Type
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{campaign.type}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Author
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{campaign.author}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Created
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(campaign.created_at)}</p>
                  </div>
                  
                  {campaign.updated_at !== campaign.created_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(campaign.updated_at)}</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Sending Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Sending Information
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recipients
                    </label>
                    <div className="flex items-center space-x-2">
                      <UserGroupIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {campaign.recipient_count} recipients
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Audience
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {campaign.target_access_levels.map((level) => (
                        <span
                          key={level}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded capitalize"
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {campaign.scheduled_send_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Scheduled Send Time
                      </label>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(campaign.scheduled_send_at)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {campaign.sent_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sent At
                      </label>
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(campaign.sent_at)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {campaign.template_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Template Used
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{campaign.template_name}</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Preview Controls */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Preview Controls
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content Type
                    </label>
                    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button
                        onClick={() => setPreviewMode('html')}
                        className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          previewMode === 'html'
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                      >
                        HTML
                      </button>
                      <button
                        onClick={() => setPreviewMode('text')}
                        className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          previewMode === 'text'
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                      >
                        Plain Text
                      </button>
                    </div>
                  </div>
                  
                  {previewMode === 'html' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Device View
                      </label>
                      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button
                          onClick={() => setViewMode('desktop')}
                          className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                            viewMode === 'desktop'
                              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                          Desktop
                        </button>
                        <button
                          onClick={() => setViewMode('mobile')}
                          className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                            viewMode === 'mobile'
                              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          <DevicePhoneMobileIcon className="h-4 w-4 mr-1" />
                          Mobile
                        </button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Preview Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Email Preview
                    </h3>
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {previewMode === 'html' ? 'HTML Version' : 'Plain Text Version'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  {/* Email Header Preview */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Email Header Preview
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16">From:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {campaign.author} &lt;noreply@yoursite.com&gt;
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16">Subject:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {campaign.subject}
                        </span>
                      </div>
                      {campaign.preview_text && (
                        <div className="flex items-start space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-16">Preview:</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {campaign.preview_text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Content Preview */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className={`transition-all duration-300 ${
                      viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                    }`}>
                      {previewMode === 'html' ? (
                        <div className="min-h-[400px] bg-white dark:bg-gray-800">
                          {campaign.html_content ? (
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none p-6"
                              dangerouslySetInnerHTML={{ __html: campaign.html_content }}
                            />
                          ) : (
                            <div className="p-6 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                              {campaign.content}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="min-h-[400px] bg-white dark:bg-gray-800 p-6">
                          <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                            {campaign.plain_text_content || campaign.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Footer */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mt-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <p>This email was sent to you because you subscribed to our newsletter.</p>
                        <p>If you no longer wish to receive these emails, you can unsubscribe.</p>
                        <p className="mt-2">© 2024 Your Company Name. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PreviewCampaignPage; 