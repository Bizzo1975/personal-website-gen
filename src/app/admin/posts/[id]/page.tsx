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
import PermissionsEditor from '@/components/admin/PermissionsEditor';
import { PostData } from '@/types/content';
import { ContentPermissions } from '@/types/content/permissions';
import { PermissionService } from '@/lib/services/permission-service';

interface PostEditFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  published: boolean;
  metaDescription: string;
  featuredImage?: string;
  permissions: ContentPermissions;
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [permissions, setPermissions] = useState<ContentPermissions>(
    PermissionService.getDefaultPermissions('all')
  );
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
        
        // Set permissions (use default if not present)
        const postPermissions = data.data.permissions || PermissionService.getDefaultPermissions('all');
        setPermissions(postPermissions);
        setValue('permissions', postPermissions);
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load post data. Please try again.');
        setIsLoading(false);
      }
    }
    
    fetchPost();
  }, [params.id, setValue]);

  const onSubmit = async (data: PostEditFormData) => {
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          permissions
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      setSuccessMessage('Post updated successfully!');
      setTimeout(() => {
        router.push('/admin/posts');
      }, 1500);
    } catch (err) {
      setError('Failed to update post. Please try again.');
    }
  };

  const handlePermissionsChange = (newPermissions: ContentPermissions) => {
    setPermissions(newPermissions);
    setValue('permissions', newPermissions);
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
      <AdminLayout title="Loading...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !post) {
    return (
      <AdminLayout title="Error">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/admin/posts')}>
            Back to Posts
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit Post: ${post?.title}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Blog Post</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/posts')}
          >
            Cancel
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
            <p className="text-green-600 dark:text-green-400">{successMessage}</p>
          </div>
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

          {/* Permissions Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <PermissionsEditor
              permissions={permissions}
              onChange={handlePermissionsChange}
              contentType="post"
            />
          </div>
          
          <div className="flex items-center">
            <Checkbox
              label="Published"
              checked={watch('published')}
              onChange={(checked) => setValue('published', checked)}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/admin/posts')}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Post
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
} 