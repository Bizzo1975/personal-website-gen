'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  LinkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Newsletter, NewsletterFormData } from '@/types/newsletter';
import { ContentPermissions } from '@/types/content/permissions';
import { BlogPost } from '@/types/content/blog';
import { PostData } from '@/lib/services/post-service';

interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  category: string;
}

const CreateNewsletterPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availablePosts, setAvailablePosts] = useState<PostData[]>([]);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [currentTab, setCurrentTab] = useState<'content' | 'design' | 'audience' | 'schedule'>('content');
  
  const [formData, setFormData] = useState<NewsletterFormData>({
    title: '',
    subject: '',
    previewText: '',
    content: '',
    type: 'regular',
    permissions: {
      level: 'all',
      allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: false,
      customRules: []
    },
    template: 'basic',
    headerImage: '',
    footerContent: '',
    includedPosts: [],
    includedProjects: [],
    scheduledAt: undefined
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API calls
      const mockPosts: PostData[] = [
        {
          id: '1',
          title: 'Building Modern React Applications with Next.js 14',
          slug: 'modern-react-nextjs-14',
          excerpt: 'Learn how to build scalable React applications using the latest Next.js features',
          date: '2024-01-15',
          content: '',
          readTime: 8,
          tags: ['React', 'Next.js', 'TypeScript'],
          author: 'Alex Johnson',
          published: true,
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          title: 'Advanced TypeScript Patterns for Better Code',
          slug: 'advanced-typescript-patterns',
          excerpt: 'Explore advanced TypeScript patterns to improve code quality and maintainability',
          date: '2024-01-12',
          content: '',
          readTime: 6,
          tags: ['TypeScript', 'Patterns', 'Best Practices'],
          author: 'Sarah Chen',
          published: true,
          updatedAt: new Date('2024-01-12')
        }
      ];

      const mockTemplates: NewsletterTemplate[] = [
        {
          id: 'basic',
          name: 'Basic Newsletter',
          description: 'Clean and simple newsletter template',
          previewImage: '/images/templates/basic.jpg',
          category: 'basic'
        },
        {
          id: 'digest',
          name: 'Blog Digest',
          description: 'Perfect for weekly blog roundups',
          previewImage: '/images/templates/digest.jpg',
          category: 'blog_digest'
        },
        {
          id: 'announcement',
          name: 'Announcement',
          description: 'Eye-catching template for important announcements',
          previewImage: '/images/templates/announcement.jpg',
          category: 'announcement'
        }
      ];

      setAvailablePosts(mockPosts);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetchining initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof NewsletterFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePermissionChange = (newPermissions: ContentPermissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Newsletter title is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Email subject is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Newsletter content is required';
    }

    if (!formData.template) {
      newErrors.template = 'Please select a template';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: 'draft' | 'scheduled') => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const newsletterData = {
        ...formData,
        status,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        htmlContent: generateHtmlContent(),
        plainTextContent: stripHtml(formData.content),
        author: 'current-user-id', // Replace with actual user ID
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock API call - replace with actual implementation
      console.log('Saving newsletter:', newsletterData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (status === 'draft') {
        router.push('/admin/newsletter/newsletters');
      } else {
        router.push(`/admin/newsletter/campaigns/create?newsletterId=${Date.now()}`);
      }
    } catch (error) {
      console.error('Error saving newsletter:', error);
      setErrors({ submit: 'Failed to save newsletter. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const generateHtmlContent = (): string => {
    // Basic HTML template generation - expand this based on selected template
    return `
      <html>
        <head>
          <meta charset="utf-8">
          <title>${formData.subject}</title>
        </head>
        <body>
          ${formData.headerImage ? `<img src="${formData.headerImage}" alt="Header" style="width: 100%; max-width: 600px;">` : ''}
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>${formData.title}</h1>
            <div>${formData.content}</div>
            ${formData.footerContent ? `<footer>${formData.footerContent}</footer>` : ''}
          </div>
        </body>
      </html>
    `;
  };

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  };

  const addBlogPostToContent = (post: PostData) => {
    const blogPostHtml = `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
        <p><strong>Read time:</strong> ${post.readTime} minutes</p>
        <p><strong>Tags:</strong> ${post.tags.join(', ')}</p>
        <a href="/blog/${post.slug}" style="color: #3b82f6; text-decoration: none;">Read more →</a>
      </div>
    `;
    
    handleInputChange('content', formData.content + blogPostHtml);
    
    // Add to included posts
    if (!formData.includedPosts?.includes(post.id)) {
      handleInputChange('includedPosts', [...(formData.includedPosts || []), post.id]);
    }
  };

  const TabNavigation = () => (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
      <nav className="flex space-x-8">
        {[
          { id: 'content', name: 'Content', icon: DocumentTextIcon },
          { id: 'design', name: 'Design', icon: PhotoIcon },
          { id: 'audience', name: 'Audience', icon: LinkIcon },
          { id: 'schedule', name: 'Schedule', icon: ClockIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as any)}
            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
              currentTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-5 w-5 mr-2" />
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );

  const ContentTab = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Newsletter Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Newsletter Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter newsletter title..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Subject Line
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.subject && <p className="text-red-600 text-sm mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview Text
            </label>
            <input
              type="text"
              value={formData.previewText}
              onChange={(e) => handleInputChange('previewText', e.target.value)}
              placeholder="This appears in email previews..."
              maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formData.previewText.length}/150 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Newsletter Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="regular">Regular Newsletter</option>
              <option value="blog_digest">Blog Digest</option>
              <option value="announcement">Announcement</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Newsletter Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your newsletter content here..."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.content && <p className="text-red-600 text-sm mt-1">{errors.content}</p>}
          </div>
        </div>
      </div>

      {/* Blog Posts Integration */}
      {formData.type === 'blog_digest' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Include Blog Posts</h3>
          
          <div className="space-y-3">
            {availablePosts.map(post => (
              <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{post.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{post.excerpt}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{post.readTime} min read</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{post.tags.join(', ')}</span>
                  </div>
                </div>
                <button
                  onClick={() => addBlogPostToContent(post)}
                  disabled={formData.includedPosts?.includes(post.id)}
                  className={`ml-4 px-3 py-1 rounded text-sm font-medium ${
                    formData.includedPosts?.includes(post.id)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
                  }`}
                >
                  {formData.includedPosts?.includes(post.id) ? (
                    <>
                      <CheckIcon className="h-4 w-4 inline mr-1" />
                      Added
                    </>
                  ) : (
                    'Add to Newsletter'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const DesignTab = () => (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Template</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              onClick={() => handleInputChange('template', template.id)}
              className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                formData.template === template.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded mb-3 flex items-center justify-center">
                <PhotoIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
            </div>
          ))}
        </div>
        {errors.template && <p className="text-red-600 text-sm mt-2">{errors.template}</p>}
      </div>

      {/* Design Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Design Options</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Header Image URL
            </label>
            <input
              type="url"
              value={formData.headerImage || ''}
              onChange={(e) => handleInputChange('headerImage', e.target.value)}
              placeholder="https://example.com/header-image.jpg"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Footer Content
            </label>
            <textarea
              value={formData.footerContent || ''}
              onChange={(e) => handleInputChange('footerContent', e.target.value)}
              placeholder="Add footer content like contact info, social links, etc."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const AudienceTab = () => (
    <div className="space-y-6">
      {/* Permission Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Target Audience</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permission Level
            </label>
            <select
              value={formData.permissions.level}
              onChange={(e) => handlePermissionChange({
                ...formData.permissions,
                level: e.target.value as 'personal' | 'professional' | 'all'
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Subscribers (Public)</option>
              <option value="professional">Professional Subscribers</option>
              <option value="personal">Personal Subscribers (Private)</option>
            </select>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formData.permissions.level === 'all' && 'Visible to all subscribers including guests'}
              {formData.permissions.level === 'professional' && 'Visible to professional subscribers (requires login)'}
              {formData.permissions.level === 'personal' && 'Visible to personal subscribers only (highest restriction)'}
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.permissions.requiresAuth}
                onChange={(e) => handlePermissionChange({
                  ...formData.permissions,
                  requiresAuth: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Require authentication to view
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Targeting */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Targeting</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Advanced targeting options will be configured when creating a campaign from this newsletter.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Campaign-Level Targeting
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You can further refine your audience by interests, tags, user roles, and custom segments when sending this newsletter as a campaign.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ScheduleTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule Options</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scheduled Send Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt ? new Date(formData.scheduledAt.getTime() - formData.scheduledAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleInputChange('scheduledAt', e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Leave empty to save as draft. You can schedule sending when creating a campaign.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Campaign Management
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                To send newsletters with advanced scheduling, audience segmentation, and analytics tracking, create a campaign after saving this newsletter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/admin/newsletter"
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back to Newsletter
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create Newsletter
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Create a new newsletter with permission-based targeting
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              
              <button
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {!previewMode ? (
          <>
            <TabNavigation />
            
            {currentTab === 'content' && <ContentTab />}
            {currentTab === 'design' && <DesignTab />}
            {currentTab === 'audience' && <AudienceTab />}
            {currentTab === 'schedule' && <ScheduleTab />}

            {errors.submit && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Newsletter Preview</h2>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl mx-auto bg-white dark:bg-gray-900">
              {formData.headerImage && (
                <img 
                  src={formData.headerImage} 
                  alt="Header" 
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
              )}
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {formData.title || 'Newsletter Title'}
              </h1>
              
              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: formData.content || '<p>Newsletter content will appear here...</p>' }} />
              </div>
              
              {formData.footerContent && (
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div dangerouslySetInnerHTML={{ __html: formData.footerContent }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNewsletterPage; 