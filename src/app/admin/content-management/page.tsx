'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { 
  BiFile, BiEdit, BiTime, BiSearch, BiCheck, BiX, BiPlus, BiCopy, 
  BiGroup, BiExport, BiImport, BiDownload, BiUpload, BiUser, 
  BiCalendar, BiMessage, BiCog, BiHistory, BiBookOpen, BiRefresh 
} from 'react-icons/bi';

interface DraftItem {
  id: string;
  title: string;
  type: 'post' | 'project' | 'page';
  author: string;
  lastModified: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  collaborators: string[];
  template?: string;
  comments: number;
}

interface ContentTemplate {
  id: string;
  name: string;
  type: 'post' | 'project' | 'page';
  description: string;
  content: string;
  createdAt: string;
  usageCount: number;
  author: string;
}

function ContentManagementPageContent() {
  const [activeTab, setActiveTab] = useState<'drafts' | 'templates' | 'collaboration' | 'import-export'>('drafts');
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
    fetchTemplates();
  }, []);

  const fetchDrafts = async () => {
    try {
      // Mock data for demonstration
      const mockDrafts: DraftItem[] = [
        {
          id: '1',
          title: 'Building Modern Web Applications with Next.js',
          type: 'post',
          author: 'admin@example.com',
          lastModified: '2024-01-15T10:30:00Z',
          status: 'draft',
          collaborators: ['editor@example.com', 'reviewer@example.com'],
          template: 'blog-post-template',
          comments: 3
        },
        {
          id: '2',
          title: 'E-commerce Platform Project',
          type: 'project',
          author: 'admin@example.com',
          lastModified: '2024-01-14T16:45:00Z',
          status: 'review',
          collaborators: ['reviewer@example.com', 'designer@example.com'],
          comments: 7
        },
        {
          id: '3',
          title: 'About Us Page Redesign',
          type: 'page',
          author: 'editor@example.com',
          lastModified: '2024-01-13T09:15:00Z',
          status: 'approved',
          collaborators: ['admin@example.com'],
          comments: 2
        },
        {
          id: '4',
          title: 'AI and Machine Learning Trends',
          type: 'post',
          author: 'editor@example.com',
          lastModified: '2024-01-12T14:20:00Z',
          status: 'published',
          collaborators: [],
          comments: 0
        }
      ];
      setDrafts(mockDrafts);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Mock data for demonstration
      const mockTemplates: ContentTemplate[] = [
        {
          id: '1',
          name: 'Technical Blog Post',
          type: 'post',
          description: 'Template for technical blog posts with code examples and explanations',
          content: '# {{title}}\n\n## Introduction\n\n{{introduction}}\n\n## Technical Details\n\n```javascript\n{{code_example}}\n```\n\n## Explanation\n\n{{explanation}}\n\n## Conclusion\n\n{{conclusion}}',
          createdAt: '2024-01-10T00:00:00Z',
          usageCount: 24,
          author: 'admin@example.com'
        },
        {
          id: '2',
          name: 'Project Showcase',
          type: 'project',
          description: 'Comprehensive template for showcasing development projects',
          content: '# {{project_name}}\n\n## Project Overview\n\n{{overview}}\n\n## Technologies Used\n\n{{technologies}}\n\n## Key Features\n\n- {{feature_1}}\n- {{feature_2}}\n- {{feature_3}}\n\n## Live Demo\n\n[View Demo]({{demo_link}})\n\n## Screenshots\n\n{{screenshots}}\n\n## Challenges & Solutions\n\n{{challenges}}',
          createdAt: '2024-01-09T00:00:00Z',
          usageCount: 15,
          author: 'admin@example.com'
        },
        {
          id: '3',
          name: 'Service Landing Page',
          type: 'page',
          description: 'Marketing landing page with hero section, features, and CTA',
          content: '# {{page_title}}\n\n## Hero Section\n\n{{hero_content}}\n\n## Key Benefits\n\n- {{benefit_1}}\n- {{benefit_2}}\n- {{benefit_3}}\n\n## Features\n\n{{features}}\n\n## Call to Action\n\n{{cta_content}}',
          createdAt: '2024-01-08T00:00:00Z',
          usageCount: 18,
          author: 'editor@example.com'
        },
        {
          id: '4',
          name: 'Tutorial Guide',
          type: 'post',
          description: 'Step-by-step tutorial template with numbered sections',
          content: '# {{title}}\n\n## What You\'ll Learn\n\n{{learning_objectives}}\n\n## Prerequisites\n\n{{prerequisites}}\n\n## Step 1: {{step_1_title}}\n\n{{step_1_content}}\n\n## Step 2: {{step_2_title}}\n\n{{step_2_content}}\n\n## Step 3: {{step_3_title}}\n\n{{step_3_content}}\n\n## Conclusion\n\n{{conclusion}}',
          createdAt: '2024-01-07T00:00:00Z',
          usageCount: 12,
          author: 'admin@example.com'
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleDraftAction = async (draftId: string, action: 'approve' | 'reject' | 'publish') => {
    try {
      // API call would go here
      console.log(`${action} draft ${draftId}`);
      await fetchDrafts();
    } catch (error) {
      console.error('Failed to perform draft action:', error);
    }
  };

  const handleExportContent = async (format: string = 'json') => {
    try {
      // Simulate export functionality
      const exportData = {
        drafts: drafts,
        templates: templates,
        exportDate: new Date().toISOString(),
        format: format
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export content:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'published':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <BiFile className="h-4 w-4" />;
      case 'project':
        return <BiCopy className="h-4 w-4" />;
      case 'page':
        return <BiBookOpen className="h-4 w-4" />;
      default:
        return <BiFile className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AdminPageLayout>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
          ))}
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Content Management System  
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Complete content workflow with drafts, templates, collaboration, and migration tools
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                <BiFile className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Drafts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{drafts.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                <BiBookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Templates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{templates.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                <BiGroup className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Collaborations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {drafts.filter(d => d.collaborators.length > 0).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mr-4">
                <BiMessage className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Comments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {drafts.reduce((sum, draft) => sum + draft.comments, 0)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'drafts', label: 'Draft System', icon: <BiTime className="h-4 w-4" /> },
            { key: 'templates', label: 'Content Templates', icon: <BiBookOpen className="h-4 w-4" /> },
            { key: 'collaboration', label: 'Collaboration', icon: <BiGroup className="h-4 w-4" /> },
            { key: 'import-export', label: 'Import/Export', icon: <BiExport className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Draft System Tab */}
      {activeTab === 'drafts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Draft/Publish Workflow
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => fetchDrafts()}>
                    <BiRefresh className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => window.open('/admin/editor/new', '_blank')}
                  >
                    <BiPlus className="h-4 w-4 mr-2" />
                    New Draft
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-gray-400 dark:text-gray-500">
                        {getTypeIcon(draft.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {draft.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(draft.status)}`}>
                            {draft.status}
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded capitalize">
                            {draft.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                          <span className="flex items-center">
                            <BiUser className="h-4 w-4 mr-1" />
                            {draft.author}
                          </span>
                          <span className="flex items-center">
                            <BiCalendar className="h-4 w-4 mr-1" />
                            {new Date(draft.lastModified).toLocaleDateString()}
                          </span>
                          {draft.collaborators.length > 0 && (
                            <span className="flex items-center">
                              <BiGroup className="h-4 w-4 mr-1" />
                              {draft.collaborators.length} collaborator{draft.collaborators.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {draft.comments > 0 && (
                            <span className="flex items-center">
                              <BiMessage className="h-4 w-4 mr-1" />
                              {draft.comments} comment{draft.comments !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/editor/${draft.id}`, '_blank')}
                      >
                        <BiEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/preview/${draft.id}`, '_blank')}
                      >
                        <BiSearch className="h-4 w-4" />
                      </Button>
                      {draft.status === 'review' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDraftAction(draft.id, 'approve')}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <BiCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDraftAction(draft.id, 'reject')}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <BiX className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {draft.status === 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDraftAction(draft.id, 'publish')}
                        >
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Content Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Reusable Content Templates
                </h3>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => window.open('/admin/templates/new', '_blank')}
                >
                  <BiPlus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-blue-600 dark:text-blue-400">
                            {getTypeIcon(template.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {template.name}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {template.type} template
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/admin/templates/${template.id}/edit`, '_blank')}
                          >
                            <BiEdit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center">
                          <BiCopy className="h-4 w-4 mr-1" />
                          Used {template.usageCount} times
                        </span>
                        <span className="flex items-center">
                          <BiUser className="h-4 w-4 mr-1" />
                          {template.author}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(`/admin/editor/new?template=${template.id}`, '_blank')}
                        >
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/admin/templates/${template.id}/preview`, '_blank')}
                        >
                          <BiSearch className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(template.content)}
                        >
                          <BiCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Collaboration Tab */}
      {activeTab === 'collaboration' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Active Collaborations
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {drafts.filter(d => d.collaborators.length > 0).map((draft) => (
                    <div key={draft.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {draft.title}
                        </h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(draft.status)}`}>
                          {draft.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-3 flex-wrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Collaborators:
                        </span>
                        {draft.collaborators.map((collaborator, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                          >
                            {collaborator}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/admin/comments/${draft.id}`, '_blank')}
                        >
                          <BiMessage className="h-4 w-4 mr-1" />
                          Comments ({draft.comments})
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/admin/editor/${draft.id}`, '_blank')}
                        >
                          <BiEdit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/admin/content-versioning?content=${draft.id}`, '_blank')}
                        >
                          <BiHistory className="h-4 w-4 mr-1" />
                          History
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Collaboration Settings
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          Real-time Editing
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Enable simultaneous editing by multiple users
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          Comment Notifications
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Notify collaborators of new comments
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          Auto-save Drafts
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Automatically save changes every 30 seconds
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Invite Collaborator
                    </h5>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option>Editor - Can edit content</option>
                        <option>Reviewer - Can review and comment</option>
                        <option>Viewer - Can view only</option>
                      </select>
                      <Button variant="primary" size="sm" className="w-full">
                        <BiGroup className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import-export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Content Export
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export your content for backup or migration purposes
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Export Format
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
                        <option value="csv">CSV</option>
                        <option value="xml">XML</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Content Types
                      </label>
                      <div className="space-y-2">
                        {['Posts', 'Projects', 'Pages', 'Templates', 'User Data', 'Comments'].map((type) => (
                          <div key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              id={type}
                              defaultChecked
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor={type} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleExportContent('json')}
                    >
                      <BiDownload className="h-4 w-4 mr-2" />
                      Export Content
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Content Import
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Import content from external sources or backups
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Import Source
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option>WordPress Export</option>
                        <option>Ghost Export</option>
                        <option>Medium Export</option>
                        <option>JSON Backup</option>
                        <option>CSV File</option>
                        <option>Markdown Files</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload File
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                        <BiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                          Supported formats: JSON, XML, CSV, ZIP (max 50MB)
                        </p>
                        <Button variant="outline" size="sm">
                          Choose File
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="preserve-ids"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="preserve-ids" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Preserve original IDs
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="skip-duplicates"
                          defaultChecked
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="skip-duplicates" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Skip duplicate content
                        </label>
                      </div>
                    </div>

                    <Button variant="primary" className="w-full" disabled>
                      <BiUpload className="h-4 w-4 mr-2" />
                      Import Content
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Migration History
              </h3>
            </CardHeader>
            <CardBody>
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <BiHistory className="mx-auto h-12 w-12" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No imports yet
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Your content import history will appear here once you start importing content
                </p>
                <Button variant="outline" size="sm">
                  <BiRefresh className="h-4 w-4 mr-2" />
                  Refresh History
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </AdminPageLayout>
  );
}

export default function ContentManagementPage() {
  return (
    <AdminLayout title="Content Management">
      <ContentManagementPageContent />
    </AdminLayout>
  );
} 