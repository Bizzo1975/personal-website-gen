'use client';

import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '@/components/AccessibilityEnhancements';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { BiPlus, BiEdit, BiTrash, BiCopy, BiEye } from 'react-icons/bi';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'post' | 'project' | 'page';
  content: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'post' | 'page' | 'project';
  category: string;
  template: {
    title: string;
    content: string;
    metadata: {
      excerpt?: string;
      tags?: string[];
      category?: string;
      estimatedReadTime?: number;
    };
    structure: {
      sections: {
        title: string;
        content: string;
        type: 'header' | 'paragraph' | 'list' | 'code' | 'image' | 'quote';
      }[];
    };
  };
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  tags: string[];
}

interface ContentTemplatesProps {
  onTemplateSelect?: (template: ContentTemplate) => void;
  onTemplateCreate?: (template: Omit<ContentTemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) => void;
  selectedType?: 'post' | 'page' | 'project' | 'all';
  className?: string;
}

const ContentTemplates: React.FC<ContentTemplatesProps> = ({
  onTemplateSelect,
  onTemplateCreate,
  selectedType = 'all',
  className = ''
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      // For now, using default empty templates until we implement the API
      const defaultTemplates: Template[] = [
        {
          id: '1',
          name: 'Blog Post Template',
          description: 'Standard template for blog posts with introduction, main content, and conclusion sections.',
          type: 'post',
          content: '# {{ title }}\n\n## Introduction\n\n{{ introduction }}\n\n## Main Content\n\n{{ content }}\n\n## Conclusion\n\n{{ conclusion }}',
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Project Showcase Template',
          description: 'Template for showcasing projects with overview, features, and technical details.',
          type: 'project',
          content: '# {{ title }}\n\n## Overview\n\n{{ overview }}\n\n## Key Features\n\n{{ features }}\n\n## Technical Details\n\n{{ techStack }}',
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setTemplates(defaultTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedType === 'all' || template.type === selectedType;
      const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
      
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect?.(template);
    
    // Update usage count
    setTemplates(prev => 
      prev.map(t => 
        t.id === template.id 
          ? { ...t, usageCount: t.usageCount + 1 }
          : t
      )
    );
  };

  const handleCreateTemplate = () => {
    setIsCreating(true);
    setSelectedTemplate({
      id: '',
      name: '',
      description: '',
      type: 'post',
      content: '',
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveTemplate = (template: Template) => {
    if (template.id) {
      // Update existing
      setTemplates(prev => 
        prev.map(t => t.id === template.id ? template : t)
      );
    } else {
      // Create new
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setTemplates(prev => [...prev, newTemplate]);
      onTemplateCreate?.(template);
    }
    
    setIsCreating(false);
    setSelectedTemplate(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Content Templates
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Start with pre-built templates or create your own
            </p>
          </div>
          
          <AccessibleButton
            onClick={handleCreateTemplate}
            variant="primary"
            size="sm"
          >
            Create Template
          </AccessibleButton>
        </div>

        {/* Filters and Search */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="usage">Sort by Usage</option>
            <option value="created">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-500 transition-colors cursor-pointer group"
              onClick={() => handleTemplateSelect(template)}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full">
                      {template.type}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                      {template.category}
                    </span>
                    {template.isDefault && (
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <div>{template.usageCount} uses</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {template.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                  >
                    #{tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    +{template.tags.length - 3} more
                  </span>
                )}
              </div>

              {/* Structure Preview */}
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                <div className="font-medium mb-1">Structure:</div>
                <div className="space-y-1">
                  {template.template.structure.sections.slice(0, 3).map((section, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        section.type === 'header' ? 'bg-blue-400' :
                        section.type === 'paragraph' ? 'bg-green-400' :
                        section.type === 'list' ? 'bg-yellow-400' :
                        section.type === 'code' ? 'bg-purple-400' :
                        section.type === 'image' ? 'bg-pink-400' : 'bg-gray-400'
                      }`}></div>
                      <span>{section.title}</span>
                    </div>
                  ))}
                  {template.template.structure.sections.length > 3 && (
                    <div className="text-slate-400 dark:text-slate-500">
                      +{template.template.structure.sections.length - 3} more sections
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-600">
                <div>Created by {template.createdBy}</div>
                <div>Updated {formatDate(template.updatedAt)}</div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No templates found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Try adjusting your search or create a new template.
            </p>
            <AccessibleButton
              onClick={handleCreateTemplate}
              variant="primary"
              size="sm"
            >
              Create Your First Template
            </AccessibleButton>
          </div>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {(isCreating || selectedTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {isCreating ? 'Create New Template' : 'Edit Template'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedTemplate(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedTemplate && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveTemplate(selectedTemplate);
                  }}
                  className="space-y-6"
                >
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={selectedTemplate.name}
                        onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Type
                      </label>
                      <select
                        value={selectedTemplate.type}
                        onChange={(e) => setSelectedTemplate({...selectedTemplate, type: e.target.value as any})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value="post">Blog Post</option>
                        <option value="page">Page</option>
                        <option value="project">Project</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={selectedTemplate.description}
                      onChange={(e) => setSelectedTemplate({...selectedTemplate, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* Template Content */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Template Title
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.template.title}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        template: { ...selectedTemplate.template, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Template title with placeholders [like this]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Template Content
                    </label>
                    <textarea
                      value={selectedTemplate.template.content}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        template: { ...selectedTemplate.template, content: e.target.value }
                      })}
                      rows={12}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
                      placeholder="Template content with markdown and placeholders..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <AccessibleButton
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setSelectedTemplate(null);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Cancel
                    </AccessibleButton>
                    <AccessibleButton
                      type="submit"
                      variant="primary"
                      size="sm"
                    >
                      {isCreating ? 'Create Template' : 'Save Changes'}
                    </AccessibleButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTemplates; 