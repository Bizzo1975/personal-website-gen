'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { TagInput } from '@/components/TagInput';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Checkbox } from '@/components/Checkbox';
import { Toast } from '@/components/Toast';

interface NewPostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  published: boolean;
  metaDescription?: string;
  featuredImage?: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<NewPostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: [],
    published: false,
    metaDescription: '',
    featuredImage: ''
  });
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
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

      setShowToast(true);
      
      // Wait 1 second before redirecting
      setTimeout(() => {
        router.push('/admin/posts');
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Create New Post">
      {showToast && (
        <Toast
          message="Post created successfully"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Input
              label="Slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <TextArea
          label="Excerpt"
          name="excerpt"
          rows={3}
          value={formData.excerpt}
          onChange={handleChange}
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Featured Image URL"
              name="featuredImage"
              value={formData.featuredImage || ''}
              onChange={handleChange}
            />
          </div>
          <div>
            <Input
              label="Meta Description"
              name="metaDescription"
              value={formData.metaDescription || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={handleTagsChange}
        />
        
        <MarkdownEditor
          label="Content"
          value={formData.content}
          onChange={handleContentChange}
          required
        />
        
        <div>
          <Checkbox
            label="Published"
            name="published"
            checked={formData.published}
            onChange={handleCheckboxChange}
          />
        </div>
        
        <div className="flex justify-between pt-4">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/posts')}>
            Cancel
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
} 