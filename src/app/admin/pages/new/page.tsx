'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';

export default function NewPagePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    slug: '',
    content: '',
    metaDescription: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create page');
      }
      
      const data = await response.json();
      
      // Redirect to the edit page for the newly created page
      router.push(`/admin/pages/${data.page._id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create page');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Create New Page</h1>
          <p className="text-gray-600 dark:text-gray-300">Add a new page to your website</p>
        </div>
        <Button href="/admin/pages" variant="outline">
          Back to Pages
        </Button>
      </div>

      <Card variant="default">
        <CardBody>
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Internal Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                For internal reference only (not displayed to users).
              </p>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Page Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-1">
                Slug
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">/</span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  placeholder="e.g. services, faq, etc."
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                The URL path for this page (e.g. /services)
              </p>
            </div>
            
            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium mb-1">
                Meta Description
              </label>
              <input
                id="metaDescription"
                name="metaDescription"
                type="text"
                value={formData.metaDescription}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                maxLength={160}
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum 160 characters for SEO optimization. {formData.metaDescription.length}/160
              </p>
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Content (Markdown)
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm h-96"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Use Markdown for formatting. Supports headings, lists, links, bold, italic, etc.
              </p>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                href="/admin/pages" 
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Page'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
} 