'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { TagInput } from '@/components/TagInput';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Checkbox } from '@/components/Checkbox';
import { Toast } from '@/components/Toast';
import { PostData } from '@/types/content';

interface PostEditFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  published: boolean;
  metaDescription: string;
  featuredImage?: string;
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PostEditFormData>();

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/posts/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        
        const data = await response.json();
        setPost(data.data);
        
        // Set form values
        setValue('title', data.data.title);
        setValue('slug', data.data.slug);
        setValue('content', data.data.content);
        setValue('excerpt', data.data.excerpt);
        setValue('tags', data.data.tags);
        setValue('published', data.data.published);
        setValue('metaDescription', data.data.metaDescription || '');
        setValue('featuredImage', data.data.featuredImage || '');
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load post data. Please try again.');
        setIsLoading(false);
      }
    }
    
    fetchPost();
  }, [params.id, setValue]);

  const onSubmit = async (formData: PostEditFormData) => {
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      setToastMessage('Post updated successfully');
      setShowToast(true);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      
    } catch (err) {
      setError('Failed to update post. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/posts/${params.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete post');
        }

        router.push('/admin/posts');
      } catch (err) {
        setError('Failed to delete post. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Edit Post">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Edit Post">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={() => router.push('/admin/posts')} className="mt-2">
            Return to Posts
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit Post: ${post?.title}`}>
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Title"
              {...register('title', { required: 'Title is required' })}
              error={errors.title?.message}
            />
          </div>
          <div>
            <Input
              label="Slug"
              {...register('slug', { required: 'Slug is required' })}
              error={errors.slug?.message}
            />
          </div>
        </div>
        
        <TextArea
          label="Excerpt"
          rows={3}
          {...register('excerpt', { required: 'Excerpt is required' })}
          error={errors.excerpt?.message}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Featured Image URL"
              {...register('featuredImage')}
              error={errors.featuredImage?.message}
            />
          </div>
          <div>
            <Input
              label="Meta Description"
              {...register('metaDescription')}
              error={errors.metaDescription?.message}
            />
          </div>
        </div>
        
        <TagInput
          label="Tags"
          value={watch('tags') || []}
          onChange={(tags) => setValue('tags', tags)}
        />
        
        <MarkdownEditor
          label="Content"
          value={watch('content') || ''}
          onChange={(value) => setValue('content', value)}
          required
        />
        
        <div>
          <Checkbox
            label="Published"
            {...register('published')}
          />
        </div>
        
        <div className="flex justify-between pt-4">
          <Button type="submit" variant="primary">
            Update Post
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete}>
            Delete Post
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
} 