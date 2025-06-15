'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import ContentVersioning from '@/components/admin/ContentVersioning';
import Card, { CardBody, CardHeader } from '@/components/Card';

interface ContentItem {
  id: string;
  title: string;
  type: 'post' | 'project' | 'page';
  lastModified: string;
}

function ContentVersioningPageContent() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContentItems();
  }, []);

  const fetchContentItems = async () => {
    try {
      const response = await fetch('/api/admin/content-items');
      if (response.ok) {
        const data = await response.json();
        setContentItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch content items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionRestore = (version: any) => {
    // Refresh content list after version restore
    fetchContentItems();
  };

  if (loading) {
    return (
      <AdminPageLayout>
        <div className="animate-pulse space-y-4">
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
          Content Versioning
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track and manage content history and versions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Content</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{contentItems.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Updates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {contentItems.filter(item => {
                    const lastModified = new Date(item.lastModified);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return lastModified > weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {contentItems.filter(item => item.type === 'post').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {contentItems.filter(item => item.type === 'project').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Select Content
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {contentItems.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No content items found</p>
                ) : (
                  contentItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedContent(item)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        selectedContent?.id === item.id
                          ? 'bg-primary-100 dark:bg-primary-900 border border-primary-300 dark:border-primary-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {item.type} • {new Date(item.lastModified).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Content Versioning */}
        <div className="lg:col-span-2">
          {selectedContent ? (
            <ContentVersioning
              contentId={selectedContent.id}
              contentType={selectedContent.type}
              onVersionRestore={handleVersionRestore}
            />
          ) : (
            <Card>
              <CardBody className="text-center py-12">
                <div className="text-slate-400 dark:text-slate-500">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Select Content to View Versions
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Choose a content item from the left to view its version history
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}

export default function ContentVersioningPage() {
  return (
    <AdminLayout title="Content Versioning">
      <ContentVersioningPageContent />
    </AdminLayout>
  );
} 