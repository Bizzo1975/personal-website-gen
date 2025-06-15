'use client';

import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '@/components/AccessibilityEnhancements';

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
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name');

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTemplates: ContentTemplate[] = [
        {
          id: '1',
          name: 'Technical Blog Post',
          description: 'A comprehensive template for technical tutorials and guides',
          type: 'post',
          category: 'Technical',
          template: {
            title: 'How to [Technology/Concept]: A Complete Guide',
            content: '# Introduction\n\nBrief overview of what will be covered...\n\n## Prerequisites\n\n- Requirement 1\n- Requirement 2\n\n## Step-by-Step Guide\n\n### Step 1: Setup\n\nDetailed instructions...\n\n### Step 2: Implementation\n\nCode examples and explanations...\n\n## Best Practices\n\nKey recommendations...\n\n## Conclusion\n\nSummary and next steps...',
            metadata: {
              tags: ['tutorial', 'guide', 'technical'],
              category: 'Development',
              estimatedReadTime: 10
            },
            structure: {
              sections: [
                { title: 'Introduction', content: 'Overview and objectives', type: 'header' },
                { title: 'Prerequisites', content: 'Required knowledge and tools', type: 'list' },
                { title: 'Step-by-Step Guide', content: 'Main tutorial content', type: 'paragraph' },
                { title: 'Code Examples', content: 'Working code snippets', type: 'code' },
                { title: 'Best Practices', content: 'Recommendations and tips', type: 'list' },
                { title: 'Conclusion', content: 'Summary and next steps', type: 'paragraph' }
              ]
            }
          },
          usageCount: 24,
          createdBy: 'John Doe',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isDefault: true,
          tags: ['technical', 'tutorial', 'development']
        },
        {
          id: '2',
          name: 'Project Showcase',
          description: 'Template for highlighting personal projects and their features',
          type: 'project',
          category: 'Portfolio',
          template: {
            title: '[Project Name] - [Brief Description]',
            content: '## Project Overview\n\n[Project description and purpose]\n\n## Key Features\n\n- Feature 1: Description\n- Feature 2: Description\n- Feature 3: Description\n\n## Technologies Used\n\n- Technology 1\n- Technology 2\n- Technology 3\n\n## Architecture\n\n[System architecture description]\n\n## Challenges & Solutions\n\n### Challenge 1\nDescription and solution...\n\n## Demo & Links\n\n- [Live Demo](url)\n- [GitHub Repository](url)\n\n## Future Enhancements\n\n- Enhancement 1\n- Enhancement 2',
            metadata: {
              tags: ['project', 'portfolio', 'showcase'],
              category: 'Portfolio'
            },
            structure: {
              sections: [
                { title: 'Project Overview', content: 'Description and purpose', type: 'paragraph' },
                { title: 'Key Features', content: 'Main functionality highlights', type: 'list' },
                { title: 'Technologies Used', content: 'Tech stack overview', type: 'list' },
                { title: 'Architecture', content: 'System design explanation', type: 'paragraph' },
                { title: 'Demo Image', content: 'Project screenshot or demo', type: 'image' },
                { title: 'Challenges & Solutions', content: 'Problem-solving highlights', type: 'paragraph' },
                { title: 'Future Enhancements', content: 'Planned improvements', type: 'list' }
              ]
            }
          },
          usageCount: 12,
          createdBy: 'John Doe',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isDefault: true,
          tags: ['project', 'portfolio', 'showcase']
        },
        {
          id: '3',
          name: 'About Page',
          description: 'Professional about page template with personal story and skills',
          type: 'page',
          category: 'Personal',
          template: {
            title: 'About [Your Name]',
            content: '# Hello, I\'m [Your Name]\n\n## My Story\n\n[Personal introduction and background]\n\n## What I Do\n\n[Professional summary and expertise]\n\n## Skills & Technologies\n\n### Frontend\n- Technology 1\n- Technology 2\n\n### Backend\n- Technology 1\n- Technology 2\n\n## Experience\n\n### [Position] at [Company]\n*[Duration]*\n\n[Description of role and achievements]\n\n## Education\n\n### [Degree] from [Institution]\n*[Year]*\n\n## Let\'s Connect\n\n[Call to action and contact information]',
            metadata: {
              excerpt: 'Learn more about my background, skills, and experience',
              tags: ['about', 'personal', 'professional']
            },
            structure: {
              sections: [
                { title: 'Introduction', content: 'Personal greeting and overview', type: 'header' },
                { title: 'Personal Story', content: 'Background and journey', type: 'paragraph' },
                { title: 'Professional Summary', content: 'What you do and expertise', type: 'paragraph' },
                { title: 'Skills Grid', content: 'Technical and soft skills', type: 'list' },
                { title: 'Experience Timeline', content: 'Work history and achievements', type: 'paragraph' },
                { title: 'Education', content: 'Academic background', type: 'paragraph' },
                { title: 'Contact CTA', content: 'Invitation to connect', type: 'paragraph' }
              ]
            }
          },
          usageCount: 8,
          createdBy: 'John Doe',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isDefault: true,
          tags: ['about', 'personal', 'professional']
        },
        {
          id: '4',
          name: 'Product Review',
          description: 'Comprehensive template for reviewing tools, books, or products',
          type: 'post',
          category: 'Review',
          template: {
            title: '[Product Name] Review: [Quick Opinion]',
            content: '## Product Overview\n\n[Basic information about the product]\n\n## Pros\n\n- Pro 1\n- Pro 2\n- Pro 3\n\n## Cons\n\n- Con 1\n- Con 2\n\n## Detailed Analysis\n\n### [Aspect 1]\n[In-depth review]\n\n### [Aspect 2]\n[In-depth review]\n\n## Comparison\n\n[How it compares to alternatives]\n\n## Final Verdict\n\n**Rating**: ⭐⭐⭐⭐⭐ (X/5)\n\n[Summary and recommendation]',
            metadata: {
              tags: ['review', 'analysis', 'recommendation'],
              category: 'Review',
              estimatedReadTime: 8
            },
            structure: {
              sections: [
                { title: 'Product Overview', content: 'Basic product information', type: 'paragraph' },
                { title: 'Pros & Cons', content: 'Quick advantages and disadvantages', type: 'list' },
                { title: 'Detailed Analysis', content: 'In-depth feature review', type: 'paragraph' },
                { title: 'Comparison Table', content: 'vs. alternatives', type: 'paragraph' },
                { title: 'Screenshots/Images', content: 'Visual examples', type: 'image' },
                { title: 'Final Verdict', content: 'Rating and recommendation', type: 'quote' }
              ]
            }
          },
          usageCount: 6,
          createdBy: 'John Doe',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          isDefault: false,
          tags: ['review', 'analysis', 'recommendation']
        }
      ];
      
      setTemplates(mockTemplates);
      setIsLoading(false);
    };

    fetchTemplates();
  }, []);

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

  const handleTemplateSelect = (template: ContentTemplate) => {
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
      category: 'General',
      template: {
        title: '',
        content: '',
        metadata: {},
        structure: {
          sections: []
        }
      },
      usageCount: 0,
      createdBy: 'John Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false,
      tags: []
    });
  };

  const handleSaveTemplate = (template: ContentTemplate) => {
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

  if (isLoading) {
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