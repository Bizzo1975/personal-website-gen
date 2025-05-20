'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  // Redirect to profile editing when user clicks to edit contact information
  const handleEditProfile = () => {
    router.push('/admin/settings/profile');
  };

  if (loading) {
    return <div className="text-center py-10">Loading data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Contact Page</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
          <a href="/contact" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            View Live Page
          </a>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
          Contact page saved successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact information preview */}
        <Card variant="default" className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <Button size="sm" onClick={handleEditProfile}>
                Edit Profile
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Email</h3>
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {profileData.email || 'No email set'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Location</h3>
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profileData.location || 'No location set'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Social Links</h3>
                <div className="flex space-x-4 mt-2">
                  {profileData.socialLinks?.github && (
                    <a 
                      href={profileData.socialLinks.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  )}
                  
                  {profileData.socialLinks?.linkedin && (
                    <a 
                      href={profileData.socialLinks.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  )}
                  
                  {profileData.socialLinks?.twitter && (
                    <a 
                      href={profileData.socialLinks.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </a>
                  )}
                  
                  {profileData.socialLinks?.website && (
                    <a 
                      href={profileData.socialLinks.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>To edit your contact information, click the "Edit Profile" button above. This will take you to the profile settings page where you can update your email, location, and social media links.</p>
            </div>
          </div>
        </Card>

        {/* Contact Page Content Form */}
        <Card variant="default" className="md:col-span-2">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={pageData.title || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meta Description
                </label>
                <input
                  type="text"
                  id="metaDescription"
                  name="metaDescription"
                  value={pageData.metaDescription || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Introduction Text (Markdown)
              </label>
              <SimpleMDE
                value={pageData.content || ''}
                onChange={handleContentChange}
                options={{
                  spellChecker: false,
                  status: false,
                  placeholder: 'Write your contact page introduction here using Markdown...',
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                This is the introduction text that appears at the top of your contact page.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 