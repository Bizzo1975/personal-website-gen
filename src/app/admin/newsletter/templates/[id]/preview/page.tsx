'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { BiEdit, BiEnvelope } from 'react-icons/bi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  html_content: string;
  plain_text_content: string;
  subject_template: string;
  preview_text_template: string;
  variables: any;
  is_active: boolean;
  is_system: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function NewsletterTemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<NewsletterTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');

  useEffect(() => {
    if (params.id) {
      fetchTemplate();
    }
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/newsletter/templates/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
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

  const getSampleData = () => {
    return {
      newsletter_title: "Sample Newsletter",
      month: "January",
      year: "2024",
      recent_posts: [
        {
          title: "Getting Started with Next.js 14",
          url: "/blog/nextjs-14-guide",
          excerpt: "Learn how to build modern web applications with the latest Next.js features.",
          date: "Jan 15, 2024",
          read_time: 5
        },
        {
          title: "Advanced TypeScript Patterns",
          url: "/blog/typescript-patterns",
          excerpt: "Explore advanced TypeScript patterns for better code organization.",
          date: "Jan 10, 2024",
          read_time: 8
        }
      ],
      recent_projects: [
        {
          title: "E-commerce Platform",
          url: "/projects/ecommerce-platform",
          description: "A full-featured e-commerce platform built with Next.js and Stripe.",
          technologies: "Next.js, TypeScript, Stripe, PostgreSQL"
        },
        {
          title: "Task Management App",
          url: "/projects/task-manager",
          description: "A collaborative task management application with real-time updates.",
          technologies: "React, Node.js, Socket.io, MongoDB"
        }
      ],
      project_title: "Sample Project",
      project_subtitle: "A demonstration project",
      project_description: "This is a sample project description to show how the template looks.",
      project_image: "/images/sample-project.jpg",
      project_url: "/projects/sample-project",
      github_url: "https://github.com/user/sample-project",
      featured_title: "Featured Article Title",
      featured_excerpt: "This is a sample excerpt for the featured article.",
      featured_url: "/blog/featured-article",
      subscriber_name: "John Doe",
      welcome_message: "Welcome to our newsletter!",
      get_started_text: "We're excited to have you on board.",
      website_url: "/",
      announcement_title: "Important Announcement",
      announcement_subtitle: "What you need to know",
      announcement_content: "This is a sample announcement content."
    };
  };

  const processTemplate = (content: string, data: any): string => {
    let processed = content;
    
    // Replace simple variables
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, value);
      }
    });

    // Process arrays (simplified)
    if (data.recent_posts && Array.isArray(data.recent_posts)) {
      const postsHtml = data.recent_posts.map((post: any) => `
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0;"><a href="${post.url}" style="color: #2563eb; text-decoration: none;">${post.title}</a></h3>
          <p style="color: #666; margin: 0 0 10px 0;">${post.excerpt}</p>
          <div style="color: #888; font-size: 14px;">${post.date} • ${post.read_time} min read</div>
        </div>
      `).join('');
      processed = processed.replace(/{{#recent_posts}}[\s\S]*?{{\/recent_posts}}/g, postsHtml);
    }

    if (data.recent_projects && Array.isArray(data.recent_projects)) {
      const projectsHtml = data.recent_projects.map((project: any) => `
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0;"><a href="${project.url}" style="color: #2563eb; text-decoration: none;">${project.title}</a></h3>
          <p style="color: #666; margin: 0 0 10px 0;">${project.description}</p>
          <div style="color: #888; font-size: 14px;">Technologies: ${project.technologies}</div>
        </div>
      `).join('');
      processed = processed.replace(/{{#recent_projects}}[\s\S]*?{{\/recent_projects}}/g, projectsHtml);
    }

    return processed;
  };

  if (loading) {
    return (
      <AdminLayout title="Template Preview">
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
      <AdminLayout title="Template Preview">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardBody className="text-center py-12">
              <div className="text-red-500 mb-4">
                <BiEnvelope className="mx-auto h-12 w-12" />
              </div>
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

  const sampleData = getSampleData();
  const processedHtml = template.html_content ? processTemplate(template.html_content, sampleData) : '';
  const processedText = template.plain_text_content ? processTemplate(template.plain_text_content, sampleData) : '';
  const processedSubject = template.subject_template ? processTemplate(template.subject_template, sampleData) : '';

  return (
    <AdminLayout title={`Preview: ${template.name}`}>
      <div className="max-w-6xl mx-auto">
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
                  {template.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{template.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => router.push(`/admin/newsletter/templates/${template.id}/edit`)}
                variant="primary"
                size="sm"
              >
                <BiEdit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardBody className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Template Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="capitalize">{template.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Usage:</span>
                  <span>{template.usage_count} times</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={template.is_active ? 'text-green-600' : 'text-red-600'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Subject Line</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                {processedSubject}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Preview Text</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                {template.preview_text_template || 'No preview text'}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Preview Controls */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview Mode:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode('html')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'html'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setPreviewMode('text')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Plain Text
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {previewMode === 'html' ? 'HTML Preview' : 'Plain Text Preview'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This preview uses sample data to show how the template will look
            </p>
          </CardHeader>
          <CardBody>
            {previewMode === 'html' ? (
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={processedHtml}
                  className="w-full h-96 border-0"
                  title="Newsletter Preview"
                />
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {processedText || 'No plain text version available'}
                </pre>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Template Variables */}
        {template.variables && Object.keys(template.variables).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Available Variables
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(template.variables).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {`{{${key}}}`}
                    </code>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
} 