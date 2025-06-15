'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { 
  BiSave, BiArrowBack, BiCopy, BiTrash 
} from 'react-icons/bi';
import { EyeIcon } from '@heroicons/react/24/outline';

interface ContentTemplate {
  id: string;
  name: string;
  type: 'post' | 'project' | 'page';
  description: string;
  content: string;
  createdAt: string;
  usageCount: number;
  author: string;
  variables: string[];
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<ContentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'post' as ContentTemplate['type'],
    content: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchTemplate(params.id as string);
    }
  }, [params.id]);

  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true);
      
      // Mock template data
      const mockTemplate: ContentTemplate = {
        id: id,
        name: 'Technical Blog Post',
        type: 'post',
        description: 'Template for technical blog posts with code examples and explanations',
        content: `# {{title}}

## Introduction

{{introduction}}

## Technical Details

\`\`\`{{language}}
{{code_example}}
\`\`\`

## Explanation

{{explanation}}

## Key Points

- {{point_1}}
- {{point_2}}
- {{point_3}}

## Conclusion

{{conclusion}}

## References

{{references}}`,
        createdAt: '2024-01-10T00:00:00Z',
        usageCount: 24,
        author: 'admin@example.com',
        variables: ['title', 'introduction', 'language', 'code_example', 'explanation', 'point_1', 'point_2', 'point_3', 'conclusion', 'references']
      };

      setTemplate(mockTemplate);
      setFormData({
        name: mockTemplate.name,
        description: mockTemplate.description,
        type: mockTemplate.type,
        content: mockTemplate.content
      });
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updatedTemplate = {
        ...template,
        ...formData,
        variables: extractVariables(formData.content)
      };

      // In real app, save to API
      const response = await fetch(`/api/admin/templates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplate)
      });

      if (response.ok) {
        setTemplate(updatedTemplate as ContentTemplate);
        alert('Template saved successfully!');
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    
    return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))];
  };

  const handlePreview = () => {
    // Create a preview with sample data
    let previewContent = formData.content;
    const variables = extractVariables(formData.content);
    
    variables.forEach(variable => {
      const sampleValue = getSampleValue(variable);
      previewContent = previewContent.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), sampleValue);
    });

    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Template Preview</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
              code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <h1>Template Preview: ${formData.name}</h1>
            <div style="white-space: pre-wrap;">${previewContent}</div>
          </body>
        </html>
      `);
    }
  };

  const getSampleValue = (variable: string): string => {
    const samples: { [key: string]: string } = {
      title: 'Sample Blog Post Title',
      introduction: 'This is a sample introduction paragraph that explains what the post is about.',
      language: 'javascript',
      code_example: 'console.log("Hello, World!");',
      explanation: 'This code demonstrates a simple console output in JavaScript.',
      point_1: 'First important point',
      point_2: 'Second important point', 
      point_3: 'Third important point',
      conclusion: 'This concludes our sample blog post.',
      references: '- [MDN Web Docs](https://developer.mozilla.org)\n- [React Documentation](https://reactjs.org)'
    };
    
    return samples[variable] || `[${variable}]`;
  };

  if (loading) {
    return (
      <AdminLayout title="Template Editor">
        <AdminPageLayout>
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
          </div>
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  if (!template) {
    return (
      <AdminLayout title="Template Editor">
        <AdminPageLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Template Not Found
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
    <AdminLayout title="Template Editor">
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
                  Template Editor
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Editing: {template.type} template • ID: {template.id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handlePreview}
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.writeText(formData.content)}
              >
                <BiCopy className="h-4 w-4 mr-2" />
                Copy
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Template Content
                </h3>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter template name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ContentTemplate['type'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="post">Blog Post</option>
                      <option value="project">Project</option>
                      <option value="page">Page</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe what this template is for..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="Write your template content with {{variables}}..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Use double curly braces for variables: {`{{variable_name}}`}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Variables */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Template Variables
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2">
                    {extractVariables(formData.content).map((variable, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-sm font-mono">{`{{${variable}}}`}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`{{${variable}}}`)}
                        >
                          <BiCopy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {extractVariables(formData.content).length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No variables found. Add variables using {`{{variable_name}}`} syntax.
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Template Info */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Template Info
                  </h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Usage Count:</span>
                    <span className="ml-2">{template.usageCount} times</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Author:</span>
                    <span className="ml-2">{template.author}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="ml-2">{new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
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
                    onClick={() => window.open(`/admin/editor/new?template=${template.id}`, '_blank')}
                  >
                    Use Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                  >
                    <BiTrash className="h-4 w-4 mr-2" />
                    Delete Template
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