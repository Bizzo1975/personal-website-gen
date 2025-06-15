'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { 
  BiSave, BiHistory, BiCog, BiArrowBack, BiCheck, BiX, BiTime 
} from 'react-icons/bi';
import { EyeIcon } from '@heroicons/react/24/outline';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  type: 'post' | 'project' | 'page';
  status: 'draft' | 'review' | 'approved' | 'published';
  tags: string[];
  author: string;
  lastModified: string;
  collaborators: string[];
  template?: string;
}

export default function ContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    status: 'draft' as ContentItem['status']
  });

  useEffect(() => {
    if (params.id) {
      fetchContent(params.id as string);
    }
  }, [params.id]);

  const fetchContent = async (id: string) => {
    try {
      setLoading(true);
      
      // Mock data - in real app, fetch from API
      const mockContent: ContentItem = {
        id: id,
        title: 'Building Modern Web Applications with Next.js',
        content: `# Building Modern Web Applications with Next.js

## Introduction

Next.js has revolutionized the way we build React applications by providing a comprehensive framework that handles many of the complexities of modern web development.

## Key Features

### Server-Side Rendering (SSR)
Next.js provides built-in SSR capabilities that improve performance and SEO.

### Static Site Generation (SSG)
Generate static pages at build time for optimal performance.

### API Routes
Build full-stack applications with built-in API routes.

## Getting Started

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## Best Practices

1. Use TypeScript for better development experience
2. Implement proper error boundaries
3. Optimize images with next/image
4. Use dynamic imports for code splitting

## Conclusion

Next.js continues to be an excellent choice for modern web development, offering powerful features while maintaining developer experience.`,
        excerpt: 'Learn how to build modern web applications using Next.js with best practices and real-world examples.',
        type: 'post',
        status: 'draft',
        tags: ['Next.js', 'React', 'Web Development', 'JavaScript'],
        author: 'admin@example.com',
        lastModified: new Date().toISOString(),
        collaborators: ['editor@example.com'],
        template: 'technical-blog-post'
      };

      setContent(mockContent);
      setFormData({
        title: mockContent.title,
        content: mockContent.content,
        excerpt: mockContent.excerpt || '',
        tags: mockContent.tags.join(', '),
        status: mockContent.status
      });
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updatedContent = {
        ...content,
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        lastModified: new Date().toISOString()
      };

      // In real app, save to API
      const response = await fetch(`/api/admin/content/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContent)
      });

      if (response.ok) {
        setContent(updatedContent as ContentItem);
        alert('Content saved successfully!');
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Failed to save content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: ContentItem['status']) => {
    try {
      const response = await fetch(`/api/admin/content/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setFormData(prev => ({ ...prev, status: newStatus }));
        setContent(prev => prev ? { ...prev, status: newStatus } : null);
        alert(`Content status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
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

  if (loading) {
    return (
      <AdminLayout title="Content Editor">
        <AdminPageLayout>
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
          </div>
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  if (!content) {
    return (
      <AdminLayout title="Content Editor">
        <AdminPageLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Content Not Found
            </h2>
            <Button onClick={() => router.back()}>
              <BiArrowBack className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Content Editor">
      <AdminPageLayout>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                <BiArrowBack className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Content Editor
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Editing: {content.type} • ID: {content.id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(formData.status)}`}>
                {formData.status}
              </span>
              <Button
                variant="outline"
                onClick={() => window.open(`/preview/${content.id}`, '_blank')}
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
              >
                <BiSave className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center space-x-2">
            {formData.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('review')}
              >
                <BiTime className="h-4 w-4 mr-1" />
                Submit for Review
              </Button>
            )}
            {formData.status === 'review' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('approved')}
                  className="text-green-600 hover:bg-green-50"
                >
                  <BiCheck className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('draft')}
                  className="text-red-600 hover:bg-red-50"
                >
                  <BiX className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {formData.status === 'approved' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange('published')}
              >
                Publish
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Content Editor
                </h3>
              </CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter content title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Brief description or excerpt..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="Write your content in Markdown..."
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Metadata */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Metadata
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="tag1, tag2, tag3"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Separate tags with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ContentItem['status'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </CardBody>
              </Card>

              {/* Content Info */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Content Info
                  </h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 capitalize">{content.type}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Author:</span>
                    <span className="ml-2">{content.author}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Last Modified:</span>
                    <span className="ml-2">{new Date(content.lastModified).toLocaleString()}</span>
                  </div>
                  {content.collaborators.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Collaborators:</span>
                      <div className="mt-1 space-y-1">
                        {content.collaborators.map((collaborator, index) => (
                          <div key={index} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            {collaborator}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Actions
                  </h3>
                </CardHeader>
                <CardBody className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open(`/admin/content-versioning?content=${content.id}`, '_blank')}
                  >
                    <BiHistory className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <BiCog className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
} 