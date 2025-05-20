'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import AdminFormLayout from '../components/AdminFormLayout';
import { AdminInput, AdminTextarea } from '../components/AdminFormField';
import Card from '@/components/Card';
import Button from '@/components/Button';
import dynamic from 'next/dynamic';
import { ProfileData } from '@/lib/services/profile-service';

// Simple markdown editor component
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import 'easymde/dist/easymde.min.css';

interface ContactPageData {
  _id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  updatedAt: Date;
}

export default function AdminContactPage() {
  const router = useRouter();
  
  // State for the contact page content
  const [pageData, setPageData] = useState<Partial<ContactPageData>>({
    name: 'Contact',
    title: 'Contact Me',
    slug: 'contact',
    content: '',
    metaDescription: 'Get in touch with me',
  });
  
  // State for the profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    imageUrl: '',
    skills: [],
    location: '',
    email: '',
    socialLinks: {
      github: '',
      twitter: '',
      linkedin: '',
      website: '',
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch both page data and profile data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch contact page data
        const pageResponse = await fetch('/api/pages?slug=contact');
        
        if (!pageResponse.ok) {
          console.error('API response error:', pageResponse.status, pageResponse.statusText);
          throw new Error(`Failed to fetch contact page data: ${pageResponse.status} ${pageResponse.statusText}`);
        }
        
        const pagesData = await pageResponse.json();
        // Check if contact page exists
        const contactPage = pagesData.find((page: any) => page.slug === 'contact');
        
        if (contactPage) {
          setPageData(contactPage);
        }
        
        // Fetch profile data
        const profileResponse = await fetch('/api/profile');
        
        if (!profileResponse.ok) {
          console.error('API response error:', profileResponse.status, profileResponse.statusText);
          throw new Error(`Failed to fetch profile data: ${profileResponse.status} ${profileResponse.statusText}`);
        }
        
        const profileData = await profileResponse.json();
        setProfileData(profileData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please check console for details.');
        setLoading(false);
      }
    };

    fetchData();
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
      // Check if we're updating or creating
      const isUpdate = !!pageData._id;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate ? `/api/pages/${pageData._id}` : '/api/pages';
      
      console.log(`${isUpdate ? 'Updating' : 'Creating'} contact page with data:`, pageData);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API save error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to save contact page: ${response.status}`);
      }
      
      // Process successful response
      const result = await response.json();
      console.log('Contact page saved successfully:', result);
      setSaving(false);
      setSaveSuccess(true);
      
      // If it was a creation, update the ID
      if (!isUpdate && result.page) {
        setPageData(result.page);
      }
      
      // Revalidate the contact page
      fetch(`/api/revalidate?path=/contact`, { method: 'POST' })
        .catch(err => {
          console.error('Error revalidating page:', err);
        });
    } catch (err: any) {
      console.error('Error saving contact page:', err);
      setError(err.message || 'Failed to save contact page');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="text-center py-10">Loading data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Contact Page">
      <AdminPageLayout
        title="Edit Contact Page"
        status={
          saveSuccess 
            ? { type: 'success', message: 'Contact page saved successfully!' }
            : error 
              ? { type: 'error', message: error }
              : undefined
        }
      >
        <AdminFormLayout
          onSubmit={handleSubmit}
          isSubmitting={saving}
          submitLabel="Save Contact Page"
          onCancel={() => router.push('/admin/dashboard')}
          actions={
            <a 
              href="/contact" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              View Live Page
            </a>
          }
        >
          <AdminInput
            id="name"
            name="name"
            label="Internal Name"
            value={pageData.name || ''}
            onChange={handleInputChange}
            required
          />
          
          <AdminInput
            id="title"
            name="title"
            label="Page Title"
            value={pageData.title || ''}
            onChange={handleInputChange}
            required
          />
          
          <AdminInput
            id="metaDescription"
            name="metaDescription"
            label="Meta Description"
            value={pageData.metaDescription || ''}
            onChange={handleInputChange}
            helpText="Brief description for search engines (recommended: 150-160 characters)"
          />
          
          <div className="space-y-1">
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Content (Markdown)
            </label>
            <SimpleMDE
              value={pageData.content || ''}
              onChange={handleContentChange}
              options={{
                spellChecker: false,
                status: false,
              }}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use markdown to format your content. This will appear above the contact form.
            </p>
          </div>
        </AdminFormLayout>
      </AdminPageLayout>
    </AdminLayout>
  );
} 