'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon,
  EyeIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';

interface CampaignFormData {
  title: string;
  subject: string;
  previewText: string;
  content: string;
  htmlContent: string;
  plainTextContent: string;
  templateId: string;
  type: 'manual' | 'automated' | 'welcome' | 'announcement';
  scheduledSendAt: string;
  sendImmediately: boolean;
  targetAccessLevels: string[];
  permissions: {
    level: string;
    allowedRoles: string[];
    allowedUsers: string[];
    restrictedUsers: string[];
    requiresAuth: boolean;
  };
  settings: {
    trackOpens: boolean;
    trackClicks: boolean;
    throttleRate: number;
    timezone: string;
  };
}

interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  subject_template: string;
  preview_text_template: string;
  html_content: string;
  plain_text_content: string;
  variables: Record<string, any>;
  is_active: boolean;
  is_system: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

const CreateCampaignPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    subject: '',
    previewText: '',
    content: '',
    htmlContent: '',
    plainTextContent: '',
    templateId: templateId || '',
    type: 'manual',
    scheduledSendAt: '',
    sendImmediately: false,
    targetAccessLevels: ['all'],
    permissions: {
      level: 'all',
      allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: false
    },
    settings: {
      trackOpens: true,
      trackClicks: true,
      throttleRate: 100,
      timezone: 'UTC'
    }
  });

  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData(prev => ({
          ...prev,
          templateId: template.id,
          subject: template.subject_template,
          previewText: template.preview_text_template || '',
          content: template.html_content || '',
          htmlContent: template.html_content || '',
          plainTextContent: template.plain_text_content || ''
        }));
      }
    }
  }, [templateId, templates]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/newsletter/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNestedInputChange = (
    parent: keyof CampaignFormData,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent] as any,
        [field]: value
      }
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId: template.id,
        subject: template.subject_template,
        previewText: template.preview_text_template || '',
        content: template.html_content || '',
        htmlContent: template.html_content || '',
        plainTextContent: template.plain_text_content || ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Email subject is required';
    }

    if (!formData.content.trim() && !formData.htmlContent.trim()) {
      newErrors.content = 'Campaign content is required';
    }

    if (!formData.sendImmediately && !formData.scheduledSendAt) {
      newErrors.scheduledSendAt = 'Please set a schedule time or select send immediately';
    }

    if (formData.scheduledSendAt && new Date(formData.scheduledSendAt) <= new Date()) {
      newErrors.scheduledSendAt = 'Scheduled time must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          subject: formData.subject,
          previewText: formData.previewText,
          content: formData.content,
          htmlContent: formData.htmlContent,
          plainTextContent: formData.plainTextContent,
          templateId: formData.templateId || null,
          type: formData.type,
          scheduledSendAt: formData.sendImmediately ? null : formData.scheduledSendAt,
          permissions: formData.permissions,
          targetAccessLevels: formData.targetAccessLevels
        })
      });

      if (response.ok) {
        router.push('/admin/content-management?tab=newsletter-campaigns');
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Failed to create campaign' });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: 'Failed to create campaign. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToContentManagement = () => {
    router.push('/admin/content-management?tab=newsletter-campaigns');
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  if (isLoading) {
    return (
      <AdminLayout title="Create Newsletter Campaign">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Create Newsletter Campaign">
    <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={handleBackToContentManagement}
                className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Content Management
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Newsletter Campaign
      </h1>
        <p className="text-gray-600 dark:text-gray-400">
              Create and schedule a new newsletter campaign
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8">
                {[
                  { key: 'details', label: 'Campaign Details', icon: DocumentTextIcon },
                  { key: 'content', label: 'Content & Template', icon: CogIcon },
                  { key: 'schedule', label: 'Schedule & Send', icon: CalendarIcon },
                  { key: 'targeting', label: 'Targeting', icon: UserGroupIcon },
                  { key: 'settings', label: 'Settings', icon: CogIcon }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Campaign Details Tab */}
            {activeTab === 'details' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Campaign Details
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Campaign Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter campaign title"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Subject *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email subject line"
                    />
                    {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preview Text
                    </label>
                    <input
                      type="text"
                      value={formData.previewText}
                      onChange={(e) => handleInputChange('previewText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Preview text that appears in email clients"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Campaign Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="manual">Manual Campaign</option>
                      <option value="automated">Automated Campaign</option>
                      <option value="welcome">Welcome Series</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Content & Template Tab */}
            {activeTab === 'content' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Content & Template
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Newsletter Template
                    </label>
                    <select
                      value={formData.templateId}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a template (optional)</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.type})
                        </option>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Campaign Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your campaign content here..."
                    />
                    {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      HTML Content (optional)
                    </label>
                    <textarea
                      value={formData.htmlContent}
                      onChange={(e) => handleInputChange('htmlContent', e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter HTML content for rich formatting..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plain Text Content (optional)
                    </label>
                    <textarea
                      value={formData.plainTextContent}
                      onChange={(e) => handleInputChange('plainTextContent', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter plain text version of your content..."
                    />
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Schedule & Send Tab */}
            {activeTab === 'schedule' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Schedule & Send
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="send-immediately"
                        name="sendOption"
                        checked={formData.sendImmediately}
                        onChange={(e) => handleInputChange('sendImmediately', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="send-immediately" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Send immediately after creation
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="send-scheduled"
                        name="sendOption"
                        checked={!formData.sendImmediately}
                        onChange={(e) => handleInputChange('sendImmediately', !e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="send-scheduled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Schedule for later
                      </label>
                    </div>
                  </div>

                  {!formData.sendImmediately && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Scheduled Send Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledSendAt}
                        onChange={(e) => handleInputChange('scheduledSendAt', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.scheduledSendAt && <p className="mt-1 text-sm text-red-600">{errors.scheduledSendAt}</p>}
                    </div>
                  )}

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Important Notes
                        </h4>
                        <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                          <li>Campaigns will be sent to all subscribers based on your targeting settings</li>
                          <li>Once sent, campaigns cannot be edited or recalled</li>
                          <li>Test your campaign thoroughly before sending</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Targeting Tab */}
            {activeTab === 'targeting' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Targeting & Audience
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <div className="space-y-2">
                      {['all', 'admin', 'editor', 'author', 'subscriber', 'guest'].map((level) => (
                        <div key={level} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`target-${level}`}
                            checked={formData.targetAccessLevels.includes(level)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange('targetAccessLevels', [...formData.targetAccessLevels, level]);
                              } else {
                                handleInputChange('targetAccessLevels', formData.targetAccessLevels.filter(l => l !== level));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`target-${level}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {level} users
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Allowed Roles
                    </label>
                    <div className="space-y-2">
                      {['admin', 'editor', 'author', 'subscriber', 'guest'].map((role) => (
                        <div key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`role-${role}`}
                            checked={formData.permissions.allowedRoles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleNestedInputChange('permissions', 'allowedRoles', [...formData.permissions.allowedRoles, role]);
                              } else {
                                handleNestedInputChange('permissions', 'allowedRoles', formData.permissions.allowedRoles.filter(r => r !== role));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`role-${role}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requires-auth"
                      checked={formData.permissions.requiresAuth}
                      onChange={(e) => handleNestedInputChange('permissions', 'requiresAuth', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requires-auth" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Require authentication to receive this campaign
                    </label>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Campaign Settings
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Track Opens
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Track when recipients open your emails
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.settings.trackOpens}
                          onChange={(e) => handleNestedInputChange('settings', 'trackOpens', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Track Clicks
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Track when recipients click links in your emails
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.settings.trackClicks}
                          onChange={(e) => handleNestedInputChange('settings', 'trackClicks', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sending Rate (emails per minute)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.settings.throttleRate}
                      onChange={(e) => handleNestedInputChange('settings', 'throttleRate', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Controls how fast emails are sent to prevent spam filtering
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.settings.timezone}
                      onChange={(e) => handleNestedInputChange('settings', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="GMT">Greenwich Mean Time</option>
                    </select>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToContentManagement}
              >
                Cancel
              </Button>
              
              <div className="flex items-center space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error Creating Campaign
                    </h4>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {errors.submit}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateCampaignPage; 