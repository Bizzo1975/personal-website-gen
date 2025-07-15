'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { TagInput } from '@/components/TagInput';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Checkbox } from '@/components/Checkbox';
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card';
import PermissionsEditor from '@/components/admin/PermissionsEditor';
import { BiUpload, BiSave } from 'react-icons/bi';
import { ContentPermissions } from '@/types/content/permissions';
import ImageField from '@/components/admin/ImageField';

// Default permissions for public content
const getDefaultPermissions = (): ContentPermissions => ({
  level: 'all',
  allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
  allowedUsers: [],
  restrictedUsers: [],
  requiresAuth: false
});

interface NewPostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  featured: boolean;
  metaDescription?: string;
  featuredImage?: string;
  permissions: ContentPermissions;
}

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<NewPostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: [],
    status: 'draft', // Default to draft
    featured: false,
    metaDescription: '',
    featuredImage: '',
    permissions: getDefaultPermissions() // Default to public access
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title if slug is empty
    if (name === 'title' && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handlePermissionsChange = (permissions: ContentPermissions) => {
    setFormData(prev => ({ ...prev, permissions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Ensure slug is URL-friendly
      const formattedData = {
        ...formData,
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-')
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post');
      }

      setSuccessMessage('Post created successfully!');
      
      // Show additional guidance for scheduled posts
      if (formattedData.status === 'scheduled') {
        setTimeout(() => {
          setSuccessMessage('Post created! Visit the Content Scheduler to set the publish date.');
        }, 800);
      }
      
      // Wait 1.5 seconds before redirecting
      setTimeout(() => {
        router.push('/admin/content-management?tab=posts');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Create New Post">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Blog Post</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/content-management?tab=posts')}
          >
            Cancel
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 dark:text-green-300">{successMessage}</p>
          </div>
        )}
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h2 className="text-lg font-medium">Post Information</h2>
            </CardHeader>
            
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Post Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  wrapperClassName="mb-0"
                />
                
                <Input
                  label="Post Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  helpText="Used in the URL, auto-generated from title"
                  wrapperClassName="mb-0"
                />
              </div>
              
              <TextArea
                label="Excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                required
                helpText="A brief summary that appears in post listings"
                wrapperClassName="mb-0"
              />
              
              <TagInput
                label="Tags"
                value={formData.tags}
                onChange={handleTagsChange}
              />
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <ImageField
                  label="Featured Image"
                  value={formData.featuredImage || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, featuredImage: url }))}
                  contentType="post"
                  placeholder="No featured image selected"
                  helpText="Select an image to display as the featured image for this post"
                />
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-medium mb-4">SEO Settings</h3>
                
                <Input
                  label="Meta Description"
                  name="metaDescription"
                  value={formData.metaDescription || ''}
                  onChange={handleChange}
                  helpText="Brief description for search engines (recommended: 150-160 characters)"
                  wrapperClassName="mb-0"
                />
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-medium mb-4">Post Content</h3>
                
                <MarkdownEditor
                  label=""
                  value={formData.content}
                  onChange={handleContentChange}
                  required
                />
              </div>

              {/* Permissions Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <PermissionsEditor
                  permissions={formData.permissions}
                  onChange={handlePermissionsChange}
                  contentType="post"
                />
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">📝 Draft - Hidden from public</option>
                      <option value="published">✅ Published - Live immediately</option>
                      <option value="scheduled">⏰ Scheduled - Publish later</option>
                    </select>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {formData.status === 'draft' && 'Draft posts are hidden from public view. You can schedule them later in Content Scheduler.'}
                      {formData.status === 'published' && 'Published posts are visible to readers immediately'}
                      {formData.status === 'scheduled' && 'Scheduled posts will be published at a future date (set in Content Scheduler)'}
                    </p>
                  </div>
                  
                  <div>
                    <Checkbox
                      label="Featured Post"
                      checked={formData.featured}
                      onChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    />
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Featured posts will be highlighted on the blog page
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
            
            <CardFooter className="flex justify-between border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/content-management?tab=posts')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                isLoading={isSubmitting}
                icon={<BiSave />}
              >
                {isSubmitting ? 'Creating...' : 'Create Post'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
} 