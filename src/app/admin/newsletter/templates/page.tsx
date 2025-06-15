'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  PhotoIcon,
  CodeBracketIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import { NewsletterTemplate } from '@/types/newsletter';

interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  popularTemplates: NewsletterTemplate[];
  recentTemplates: NewsletterTemplate[];
}

const NewsletterTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockTemplates: NewsletterTemplate[] = [
        {
          id: 'basic-clean',
          name: 'Clean & Simple',
          description: 'A minimalist template perfect for regular newsletters',
          previewImage: '/images/templates/clean-simple.jpg',
          htmlTemplate: '<div>Basic Template</div>',
          cssStyles: '.basic { color: blue; }',
          variables: [
            { name: 'primaryColor', type: 'color', defaultValue: '#3b82f6', description: 'Primary brand color' }
          ],
          category: 'basic',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10')
        },
        {
          id: 'blog-digest',
          name: 'Weekly Blog Digest',
          description: 'Perfect for showcasing multiple blog posts in a clean format',
          previewImage: '/images/templates/blog-digest.jpg',
          htmlTemplate: '<div>Blog Digest Template</div>',
          cssStyles: '.digest { color: green; }',
          variables: [
            { name: 'accentColor', type: 'color', defaultValue: '#10b981', description: 'Accent color for highlights' },
            { name: 'headerImage', type: 'image', defaultValue: '', description: 'Header background image' }
          ],
          category: 'blog_digest',
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-14')
        },
        {
          id: 'announcement-bold',
          name: 'Bold Announcement',
          description: 'Eye-catching template for important announcements and updates',
          previewImage: '/images/templates/announcement-bold.jpg',
          htmlTemplate: '<div>Announcement Template</div>',
          cssStyles: '.announcement { color: red; }',
          variables: [
            { name: 'alertColor', type: 'color', defaultValue: '#ef4444', description: 'Alert color for urgent messages' },
            { name: 'buttonColor', type: 'color', defaultValue: '#1f2937', description: 'Call-to-action button color' }
          ],
          category: 'announcement',
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 'professional-modern',
          name: 'Modern Professional',
          description: 'Sleek design for business communications and professional updates',
          previewImage: '/images/templates/professional-modern.jpg',
          htmlTemplate: '<div>Professional Template</div>',
          cssStyles: '.professional { color: purple; }',
          variables: [
            { name: 'brandColor', type: 'color', defaultValue: '#6366f1', description: 'Brand color' },
            { name: 'backgroundColor', type: 'color', defaultValue: '#f8fafc', description: 'Background color' }
          ],
          category: 'custom',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-11')
        },
        {
          id: 'newsletter-classic',
          name: 'Classic Newsletter',
          description: 'Traditional newsletter layout with header, content sections, and footer',
          previewImage: '/images/templates/classic.jpg',
          htmlTemplate: '<div>Classic Template</div>',
          cssStyles: '.classic { color: black; }',
          variables: [
            { name: 'logoUrl', type: 'image', defaultValue: '', description: 'Company logo URL' },
            { name: 'fontFamily', type: 'text', defaultValue: 'Arial, sans-serif', description: 'Font family' }
          ],
          category: 'basic',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-05')
        },
        {
          id: 'product-showcase',
          name: 'Product Showcase',
          description: 'Highlight products, services, or portfolio items with visual appeal',
          previewImage: '/images/templates/product-showcase.jpg',
          htmlTemplate: '<div>Product Template</div>',
          cssStyles: '.product { color: orange; }',
          variables: [
            { name: 'ctaColor', type: 'color', defaultValue: '#f59e0b', description: 'Call-to-action color' },
            { name: 'showPricing', type: 'text', defaultValue: 'true', description: 'Show pricing information' }
          ],
          category: 'custom',
          createdAt: new Date('2024-01-06'),
          updatedAt: new Date('2024-01-09')
        }
      ];

      setTemplates(mockTemplates);
      
      const mockStats: TemplateStats = {
        totalTemplates: mockTemplates.length,
        activeTemplates: mockTemplates.length,
        popularTemplates: mockTemplates.slice(0, 2),
        recentTemplates: mockTemplates.slice(-2)
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic':
        return <DocumentDuplicateIcon className="h-5 w-5" />;
      case 'blog_digest':
        return <PhotoIcon className="h-5 w-5" />;
      case 'announcement':
        return <SwatchIcon className="h-5 w-5" />;
      case 'custom':
        return <CodeBracketIcon className="h-5 w-5" />;
      default:
        return <DocumentDuplicateIcon className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'blog_digest':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'announcement':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'custom':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleDuplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const duplicated = {
        ...template,
        id: `${template.id}-copy-${Date.now()}`,
        name: `${template.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setTemplates(prev => [...prev, duplicated]);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    setShowDeleteModal(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Newsletter Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage beautiful newsletter templates
          </p>
        </div>
        <Link
          href="/admin/newsletter/templates/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
              <PhotoIcon className="h-16 w-16 text-gray-400" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/admin/newsletter/templates/${template.id}/edit`}
                    className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <Link
                  href={`/admin/newsletter/create?template=${template.id}`}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Use Template
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsletterTemplatesPage; 