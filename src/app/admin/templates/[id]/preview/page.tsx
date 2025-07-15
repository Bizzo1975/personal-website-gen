'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { BiEdit, BiFile } from 'react-icons/bi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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

export default function ContentTemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<ContentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'rendered' | 'source'>('rendered');

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
      title: "Sample Project Title",
      project_title: "Sample Project Title",
      project_overview: "This is a comprehensive web application built with modern technologies. It demonstrates best practices in full-stack development, including responsive design, secure authentication, and scalable architecture.",
      project_type: "Web Application",
      project_duration: "3 months",
      my_role: "Full-Stack Developer",
      challenge_description: "The main challenge was creating a scalable system that could handle thousands of concurrent users while maintaining fast response times and ensuring data consistency.",
      tech_stack: [
        { category: "Frontend", technologies: "React, TypeScript, Tailwind CSS" },
        { category: "Backend", technologies: "Node.js, Express, PostgreSQL" },
        { category: "DevOps", technologies: "Docker, AWS, GitHub Actions" }
      ],
      frontend_tech: ["React 18", "TypeScript", "Tailwind CSS", "Next.js"],
      backend_tech: ["Node.js", "Express.js", "PostgreSQL", "Redis"],
      features: [
        "User authentication and authorization",
        "Real-time notifications",
        "Responsive design for all devices",
        "Advanced search and filtering",
        "Analytics dashboard",
        "API integration"
      ],
      results_description: "The application successfully serves over 10,000 active users with a 99.9% uptime. User engagement increased by 45% compared to the previous version, and page load times improved by 60%.",
      app_name: "TaskFlow Pro",
      app_description: "A comprehensive task management application designed for modern teams",
      live_url: "https://taskflow-pro.example.com",
      github_url: "https://github.com/username/taskflow-pro",
      completion_date: "December 2024",
      introduction: "In this comprehensive guide, we'll explore the latest features and best practices for modern web development.",
      problem_description: "Many developers struggle with implementing efficient state management in large React applications, leading to performance issues and maintainable code challenges.",
      solution_overview: "We'll implement a robust state management solution using Redux Toolkit and React Query, providing both global state management and efficient server state handling.",
      language: "typescript",
      code_example: `// Example of efficient state management
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
}

const userSlice = createSlice({
  name: 'user',
  initialState: { currentUser: null as User | null },
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;`,
      conclusion: "By implementing these patterns, you'll create more maintainable and performant applications that scale with your team's needs.",
      publish_date: "January 15, 2024",
      read_time: "8",
      learning_objectives: [
        "Understanding modern state management patterns",
        "Implementing efficient data fetching strategies",
        "Building scalable React applications"
      ],
      prerequisites: [
        "Basic knowledge of React and TypeScript",
        "Familiarity with modern JavaScript ES6+",
        "Understanding of REST APIs"
      ],
      getting_started: "First, ensure you have Node.js 18+ installed on your system. Then clone the repository and install dependencies.",
      next_steps: "Now that you've completed this tutorial, try implementing these patterns in your own projects. Consider exploring advanced topics like micro-frontends and server-side rendering.",
      content: "This is the main content area where you can write detailed explanations, code examples, and provide comprehensive information about your topic.",
      summary: "We've covered the essential concepts of modern state management, from basic patterns to advanced optimization techniques."
    };
  };

  const processTemplate = (content: string, data: any): string => {
    let processed = content;
    
    // Replace simple variables
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, String(value));
      }
    });

    // Process arrays
    if (data.tech_stack && Array.isArray(data.tech_stack)) {
      const techStackText = data.tech_stack.map((item: any) => `- **${item.category}:** ${item.technologies}`).join('\n');
      processed = processed.replace(/{{#tech_stack}}[\s\S]*?{{\/tech_stack}}/g, techStackText);
    }

    if (data.features && Array.isArray(data.features)) {
      const featuresText = data.features.map((feature: string) => `- ${feature}`).join('\n');
      processed = processed.replace(/{{#features}}[\s\S]*?{{\/features}}/g, featuresText);
    }

    if (data.frontend_tech && Array.isArray(data.frontend_tech)) {
      const frontendText = data.frontend_tech.map((tech: string) => `- ${tech}`).join('\n');
      processed = processed.replace(/{{#frontend_tech}}[\s\S]*?{{\/frontend_tech}}/g, frontendText);
    }

    if (data.backend_tech && Array.isArray(data.backend_tech)) {
      const backendText = data.backend_tech.map((tech: string) => `- ${tech}`).join('\n');
      processed = processed.replace(/{{#backend_tech}}[\s\S]*?{{\/backend_tech}}/g, backendText);
    }

    if (data.learning_objectives && Array.isArray(data.learning_objectives)) {
      const objectivesText = data.learning_objectives.map((obj: string) => `- ${obj}`).join('\n');
      processed = processed.replace(/{{#learning_objectives}}[\s\S]*?{{\/learning_objectives}}/g, objectivesText);
    }

    if (data.prerequisites && Array.isArray(data.prerequisites)) {
      const prereqText = data.prerequisites.map((prereq: string) => `- ${prereq}`).join('\n');
      processed = processed.replace(/{{#prerequisites}}[\s\S]*?{{\/prerequisites}}/g, prereqText);
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
                <BiFile className="mx-auto h-12 w-12" />
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
  const processedContent = processTemplate(template.content, sampleData);

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
                onClick={() => window.location.href = `/admin/templates/${template.id}/edit`}
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
                  <span className="capitalize">{template.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Usage:</span>
                  <span>{template.usageCount} times</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Author:</span>
                  <span>{template.author}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Created</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Variables</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.variables?.length || 0} variables
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
                onClick={() => setPreviewMode('rendered')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'rendered'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Rendered
              </button>
              <button
                onClick={() => setPreviewMode('source')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'source'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Source
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {previewMode === 'rendered' ? 'Rendered Preview' : 'Source Code'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {previewMode === 'rendered' 
                ? 'This preview uses sample data to show how the template will look'
                : 'Raw template content with variable placeholders'
              }
            </p>
          </CardHeader>
          <CardBody>
            {previewMode === 'rendered' ? (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: processedContent.replace(/\n/g, '<br>') }}
                />
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {template.content}
                </pre>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Template Variables */}
        {template.variables && template.variables.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Available Variables
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {template.variables.map((variable) => (
                  <div key={variable} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {`{{${variable}}}`}
                    </code>
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