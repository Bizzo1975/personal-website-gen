'use client'
import '@/styles/globals.css';
;

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';

// Simple markdown editor component
import dynamic from 'next/dynamic';
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import 'easymde/dist/easymde.min.css';

export default function NewPagePage() {
  const router = useRouter();
  
  const [pageData, setPageData] = useState({
    name: '',
    title: '',
    slug: '',
    content: '',
    metaDescription: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPageData({
      ...pageData,
      [name]: value,
    });
  };

  const handleContentChange = (value: string) => {
    setPageData({
      ...pageData,
      content: value,
    });
  };

  const generateSlug = () => {
    if (pageData.title) {
      const slug = pageData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      setPageData({
        ...pageData,
        slug,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Make the actual API call
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create page');
      }
      
      // Process successful response
      const result = await response.json();
      setSaving(false);
      router.push('/admin/pages');
    } catch (err: any) {
      setError(err.message || 'Failed to create page');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create New Page</h1>
        <Button variant="outline" onClick={() => router.push('/admin/pages')}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md dark:bg-red-900 dark:text-red-300">
          {error}
        </div>
      )}

      <Card variant="default">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Internal Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={pageData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                required
                placeholder="e.g., Contact Page"
              />
              <p className="text-xs text-gray-500 mt-1">Internal reference only (not displayed to users)</p>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Title
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={pageData.title}
                  onChange={handleInputChange}
                  onBlur={() => {
                    if (!pageData.slug) generateSlug();
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                  required
                  placeholder="e.g., Contact Us"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL Slug
              </label>
              <div className="flex items-stretch">
                <span className="text-gray-500 mr-2 flex items-center">/</span>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={pageData.slug}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                  required
                  placeholder="e.g., contact"
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm flex-none self-stretch"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Will be used in the URL: yourdomain.com/[slug]</p>
            </div>
            
            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                value={pageData.metaDescription}
                onChange={handleInputChange}
                rows={2}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                placeholder="Brief description for search engines (optional)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content (Markdown)
            </label>
            <SimpleMDE
              value={pageData.content}
              onChange={handleContentChange}
              options={{
                spellChecker: false,
                status: false,
                placeholder: 'Write your page content here using Markdown...',
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Page'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 