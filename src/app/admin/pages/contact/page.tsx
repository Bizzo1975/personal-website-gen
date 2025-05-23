'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Card from '@/components/Card';

// Import SimpleMDE editor
import dynamic from 'next/dynamic';
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import 'easymde/dist/easymde.min.css';

interface PageData {
  _id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  headerTitle: string;
  headerSubtitle: string;
  updatedAt: Date;
}

export default function AdminContactPageEditor() {
  const router = useRouter();
  const [pageData, setPageData] = useState<Partial<PageData>>({
    name: 'Contact Page',
    title: 'Contact Me',
    slug: 'contact',
    content: '',
    metaDescription: 'Contact me for work opportunities, collaborations, or questions.',
    headerTitle: 'Contact Me',
    headerSubtitle: 'Have a question or want to work together? Get in touch with me using the form below or through any of my social channels.',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Debug: Log pageData changes
  useEffect(() => {
    console.log('📊 [Contact Admin] pageData state changed:', {
      name: pageData.name,
      title: pageData.title,
      metaDescription: pageData.metaDescription,
      headerTitle: pageData.headerTitle,
      headerSubtitle: pageData.headerSubtitle?.substring(0, 50) + '...',
      _id: pageData._id
    });
  }, [pageData]);
  
  useEffect(() => {
    console.log('🔄 [Contact Admin] useEffect triggered');
    console.log('🔄 [Contact Admin] Initial pageData state:', pageData);
    
    const fetchContactPage = async () => {
      console.log('🔍 [Contact Admin] Starting fetch...');
      setLoading(true);
      setError(null);
      
      try {
        // Simple fetch like the projects page
        console.log('📡 [Contact Admin] Fetching /api/pages?slug=contact');
        const response = await fetch('/api/pages?slug=contact');
        
        console.log('📊 [Contact Admin] Response status:', response.status);
        console.log('📊 [Contact Admin] Response OK:', response.ok);
        
        if (!response.ok) {
          console.error('❌ [Contact Admin] Response not OK:', response.status);
          throw new Error(`Failed to fetch contact page: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 [Contact Admin] Raw API response:', data);
        
        if (data && data.page) {
          console.log('✅ [Contact Admin] Page data found in response');
          console.log('📄 [Contact Admin] Page details:', {
            id: data.page._id,
            name: data.page.name,
            title: data.page.title,
            metaDescription: data.page.metaDescription,
            headerTitle: data.page.headerTitle,
            headerSubtitle: data.page.headerSubtitle?.substring(0, 50) + '...'
          });
          
          // Set all the page data at once like projects page
          const newPageData = {
            _id: data.page._id,
            name: data.page.name || 'Contact Page',
            title: data.page.title || 'Contact Me',
            slug: 'contact',
            content: data.page.content || '',
            metaDescription: data.page.metaDescription || 'Contact me for work opportunities, collaborations, or questions.',
            headerTitle: data.page.headerTitle || 'Contact Me',
            headerSubtitle: data.page.headerSubtitle || 'Have a question or want to work together? Get in touch with me using the form below or through any of my social channels.'
          };
          
          console.log('🔧 [Contact Admin] Setting new pageData:', newPageData);
          setPageData(newPageData);
          console.log('✅ [Contact Admin] Page data set successfully');
        } else {
          // If page doesn't exist, keep the default values
          console.log('⚠️ [Contact Admin] No page data in response, keeping defaults');
          console.log('Contact page not found, will create a new one on save');
        }
      } catch (err) {
        console.error('❌ [Contact Admin] Fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('❌ [Contact Admin] Error details:', errorMessage);
        setError('Failed to load contact page. Please check console for details.');
      } finally {
        console.log('🏁 [Contact Admin] Fetch completed, setting loading to false');
        setLoading(false);
      }
    };
    
    fetchContactPage();
  }, []);
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      let response;
      
      if (pageData._id) {
        // Update existing page - simplified like projects page
        response = await fetch(`/api/pages/${pageData._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pageData),
          cache: 'no-store',
        });
      } else {
        // Create new page
        response = await fetch('/api/pages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pageData),
          cache: 'no-store',
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save page: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Contact page updated successfully:', result);
      setSaving(false);
      setSaveSuccess(true);
      
      // Revalidate the contact page
      await fetch(`/api/revalidate?path=/contact`, { method: 'POST' });
      
      setTimeout(() => {
        router.push('/admin/pages');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving contact page:', err);
      setError(err.message || 'Failed to save page');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout title="Contact Page Editor">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4">Loading Contact Page Editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Contact Page">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {saveSuccess && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            Contact page saved successfully! Redirecting...
          </div>
        )}
        
        <Card variant="default">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Internal Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={pageData.name || 'Contact Page'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={pageData.title || 'Contact Me'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                value={pageData.metaDescription || ''}
                onChange={handleInputChange}
                rows={2}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                placeholder="Brief description for search engines"
              />
            </div>
            
            <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Page Header</h3>
              
              <div className="mb-4">
                <label htmlFor="headerTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Header Title
                </label>
                <input
                  type="text"
                  id="headerTitle"
                  name="headerTitle"
                  value={pageData.headerTitle || 'Contact Me'}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                  placeholder="Contact Me"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Main heading displayed at the top of the contact page
                </p>
              </div>
              
              <div>
                <label htmlFor="headerSubtitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Header Subtitle
                </label>
                <textarea
                  id="headerSubtitle"
                  name="headerSubtitle"
                  value={pageData.headerSubtitle || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                  placeholder="Have a question or want to work together? Get in touch with me using the form below or through any of my social channels."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Subtitle text displayed below the main heading
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Content (Markdown)
              </label>
              <SimpleMDE
                value={pageData.content || ''}
                onChange={handleContentChange}
                options={{
                  spellChecker: false,
                  status: false,
                  placeholder: "Enter the main content for the contact page..."
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Content displayed in the main body of the contact page
              </p>
            </div>

            <div className="flex justify-end gap-4 border-t pt-6">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.push('/admin/pages')}
              >
                Cancel
              </Button>
              
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Contact Page'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
} 