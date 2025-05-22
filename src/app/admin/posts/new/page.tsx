'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import { TagInput } from '@/components/TagInput';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Checkbox } from '@/components/Checkbox';
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card';
import { BiUpload, BiSave } from 'react-icons/bi';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title if slug is empty
    if (name === 'title' && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
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
  
  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Ensure slug is URL-friendly
      const formattedData = {
        ...formData,
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        featuredImage: imagePreview || formData.featuredImage // Use preview if available
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
      
      // Wait 1.5 seconds before redirecting
      setTimeout(() => {
        router.push('/admin/posts');
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
            onClick={() => router.push('/admin/posts')}
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
        
        <Card variant="default">
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
              
              <Textarea
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
                <h3 className="font-medium mb-4">Featured Image</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageUploadClick}
                      icon={<BiUpload />}
                      className="mb-2"
                    >
                      Upload Image
                    </Button>
                    
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Or enter a URL:
                    </div>
                    
                    <Input
                      name="featuredImage"
                      value={formData.featuredImage}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      wrapperClassName="mt-2 mb-0"
                    />
                  </div>
                  
                  <div>
                    {imagePreview ? (
                      <div className="relative w-full h-40 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${imagePreview})` }}></div>
                      </div>
                    ) : formData.featuredImage ? (
                      <div className="relative w-full h-40 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${formData.featuredImage})` }}></div>
                      </div>
                    ) : (
                      <div className="w-full h-40 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500">
                        No image selected
                      </div>
                    )}
                  </div>
                </div>
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
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <Checkbox
                  label="Published"
                  name="published"
                  checked={formData.published}
                  onChange={handleCheckboxChange}
                />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  When checked, this post will be visible to visitors. Otherwise, it will be saved as a draft.
                </p>
              </div>
            </CardBody>
            
            <CardFooter className="flex justify-between border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/posts')}
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