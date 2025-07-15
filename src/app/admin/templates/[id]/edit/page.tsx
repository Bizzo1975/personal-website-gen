'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { BiSave } from 'react-icons/bi';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ContentTemplate {
  id: string;
  name: string;
  type: 'post' | 'project' | 'page';
  description: string;
  content: string;
  createdAt: string;
  usageCount: number;
  author: string;
  variables?: string[];
}

export default function ContentTemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<ContentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'post' as 'post' | 'project' | 'page',
    description: '',
    content: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchTemplate();
    }
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/templates/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
        setFormData({
          name: data.name,
          type: data.type,
          description: data.description,
          content: data.content
        });
      } else {
        setError('Failed to fetch template');
      }
    } catch (err) {
      setError('Error fetching template');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // TODO: Implement actual save functionality
      console.log('Saving template:', { id: params.id, ...formData });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Template saved successfully!');
      
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    window.location.href = `/admin/templates/${params.id}/preview`;
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Template">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !template) {
    return (
      <AdminLayout title="Edit Template">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardBody className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {error || 'Template not found'}
              </h3>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardBody>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit: ${template.name}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.back()} variant="outline" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Template
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{template.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handlePreview} variant="outline" size="sm">
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSave} 
                variant="primary" 
                size="sm"
                disabled={saving}
              >
                <BiSave className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Template Details
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'post' | 'project' | 'page' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="post">Blog Post</option>
                  <option value="project">Project</option>
                  <option value="page">Page</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this template..."
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Template Content
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use {`{{variable_name}}`} for variables that will be replaced with content
              </p>
            </CardHeader>
            <CardBody>
              <div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter your template content here..."
                />
              </div>
            </CardBody>
          </Card>

          {/* Template Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Template Information
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Usage Count:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {template.usageCount} times
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Author:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {template.author}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 