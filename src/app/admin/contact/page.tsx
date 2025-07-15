'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import AdminFormLayout from '../components/AdminFormLayout';
import { AdminInput, AdminTextarea } from '../components/AdminFormField';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ProfileData } from '@/lib/services/profile-service';

interface ContactPageData {
  id: string;
  name: string;
  title: string;
  slug: string;
  metaDescription: string;
  updatedAt: Date;
  headerTitle: string;
  headerSubtitle: string;
  connectSectionTitle: string;
  connectSectionContent: string;
  formSectionTitle: string;
  formDescription: string;
}

export default function AdminContactPage() {
  const router = useRouter();
  
  // State for the contact page content
  const [pageData, setPageData] = useState<Partial<ContactPageData>>({
    name: 'Contact',
    title: 'Contact Me',
    slug: 'contact',
    metaDescription: 'Get in touch with me',
    headerTitle: 'Get in Touch',
    headerSubtitle: 'Have a question or want to work together? Send me a message!',
    connectSectionTitle: 'Let\'s Connect',
    connectSectionContent: 'I am always open to discussing new opportunities, collaborations, or just having a conversation about technology and development.',
    formSectionTitle: 'Send Me a Message or Request Access',
    formDescription: 'Use the form below to either send a general message or request access to register on the platform. For access requests, please select the appropriate access level and provide details about your intended use.'
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
      linkedin: '',
      website: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMetadataCollapsed, setIsMetadataCollapsed] = useState(true);

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
        
        const contactPageData = await pageResponse.json();
        // Fix: Handle the response correctly
        if (contactPageData && contactPageData.id) {
          setPageData({
            id: contactPageData.id,
            name: contactPageData.name || 'Contact',
            title: contactPageData.title || 'Contact Me',
            slug: contactPageData.slug || 'contact',
            metaDescription: contactPageData.metaDescription || 'Get in touch with me',
            headerTitle: contactPageData.headerTitle || 'Get in Touch',
            headerSubtitle: contactPageData.headerSubtitle || 'Have a question or want to work together? Send me a message!',
            connectSectionTitle: contactPageData.connectSectionTitle || 'Let\'s Connect',
            connectSectionContent: contactPageData.connectSectionContent || 'I am always open to discussing new opportunities, collaborations, or just having a conversation about technology and development.',
            formSectionTitle: contactPageData.formSectionTitle || 'Send Me a Message or Request Access',
            formDescription: contactPageData.formDescription || 'Use the form below to either send a general message or request access to register on the platform. For access requests, please select the appropriate access level and provide details about your intended use.'
          });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      // Check if we're updating or creating
      const isUpdate = !!pageData.id;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate ? `/api/pages/${pageData.id}` : '/api/pages';
      
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
      if (!isUpdate && result.page?.id) {
        setPageData({
          ...pageData,
          id: result.page.id
        });
      }
      
      // Revalidate the contact page
      try {
        await fetch(`/api/revalidate?path=/contact`, { method: 'POST' });
      } catch (revalidateError) {
        console.warn('Failed to revalidate contact page:', revalidateError);
      }
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving contact page:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save contact page';
      setError(errorMessage);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4">Loading Contact Page Editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Contact Page">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          {/* Collapsible Edit Contact Page Header */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setIsMetadataCollapsed(!isMetadataCollapsed)}
              className="w-full flex items-center justify-between p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
            >
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Contact Page</h1>
              <div className="flex items-center space-x-3">
                <a 
                  href="/contact" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Live Page
                </a>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                    isMetadataCollapsed ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {!isMetadataCollapsed && (
              <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                <AdminInput
                  id="name"
                  name="name"
                  label="Internal Name"
                  value={pageData.name || ''}
                  onChange={handleInputChange}
                />

                <AdminInput
                  id="title"
                  name="title"
                  label="Page Title"
                  value={pageData.title || ''}
                  onChange={handleInputChange}
                  required
                  helpText="The title shown in browser tabs and search results"
                />

                <AdminInput
                  id="metaDescription"
                  name="metaDescription"
                  label="Meta Description"
                  value={pageData.metaDescription || ''}
                  onChange={handleInputChange}
                  helpText="Brief description for search engines (recommended: 150-160 characters)"
                />
              </div>
            )}
          </div>
          
          {/* Status Messages */}
          {saveSuccess && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              Contact page saved successfully!
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Page Header Fields - Always Visible */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contact Page Header</h3>
            
            <AdminInput
              id="headerTitle"
              name="headerTitle"
              label="Header Title"
              value={pageData.headerTitle || ''}
              onChange={handleInputChange}
              helpText="The main heading displayed at the top of the contact page"
              required
            />
            
            <AdminTextarea
              id="headerSubtitle"
              name="headerSubtitle"
              label="Header Subtitle"
              value={pageData.headerSubtitle || ''}
              onChange={handleInputChange}
              helpText="The subtitle displayed below the main heading"
              rows={2}
            />
          </div>

          {/* Connect Section Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Connect Section</h3>
            
            <AdminInput
              id="connectSectionTitle"
              name="connectSectionTitle"
              label="Connect Section Title"
              value={pageData.connectSectionTitle || ''}
              onChange={handleInputChange}
              helpText="The title for the left column contact information section"
            />
            
            <AdminTextarea
              id="connectSectionContent"
              name="connectSectionContent"
              label="Connect Section Content"
              value={pageData.connectSectionContent || ''}
              onChange={handleInputChange}
              helpText="The content text displayed in the left column under the connect section title"
              rows={3}
            />
          </div>

          {/* Form Section Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Form Section</h3>
            
            <AdminInput
              id="formSectionTitle"
              name="formSectionTitle"
              label="Form Section Title"
              value={pageData.formSectionTitle || ''}
              onChange={handleInputChange}
              helpText="The title for the right column contact form section"
            />
            
            <AdminTextarea
              id="formDescription"
              name="formDescription"
              label="Form Description"
              value={pageData.formDescription || ''}
              onChange={handleInputChange}
              helpText="The description text displayed above the contact form"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Contact Page'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
} 