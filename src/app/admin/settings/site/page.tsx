'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import AdminPageLayout from '../../components/AdminPageLayout';
import AdminFormLayout from '../../components/AdminFormLayout';
import { AdminInput, AdminTextarea } from '../../components/AdminFormField';

interface NavbarLink {
  label: string;
  url: string;
  isExternal: boolean;
}

interface SiteSettings {
  id?: string;
  logoUrl: string;
  logoText: string;
  footerText: string;
  bioText: string;
  navbarStyle: string;
  navbarLinks: NavbarLink[];
}

export default function SiteSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    logoUrl: '/images/jlk-logo.png',
    logoText: 'Jonathan L Keck',
    footerText: 'Built with Next.js and Tailwind CSS',
    bioText: 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.',
    navbarStyle: 'default',
    navbarLinks: [
      { label: 'Home', url: '/', isExternal: false },
      { label: 'About', url: '/about', isExternal: false },
      { label: 'Projects', url: '/projects', isExternal: false },
      { label: 'Blog', url: '/blog', isExternal: false },
      { label: 'Contact', url: '/contact', isExternal: false },
    ]
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch the site settings using client-side API call
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/site-settings');
        if (response.ok) {
          const data = await response.json();
          setSiteSettings(data);
        } else {
          throw new Error('Failed to fetch site settings');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching site settings:', err);
        setError('Failed to load site settings');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSiteSettings({
      ...siteSettings,
      [name]: value,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        setUploadProgress(1);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'logo');
        
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          setUploadProgress(100);
          
          setSiteSettings({
            ...siteSettings,
            logoUrl: result.path
          });
          
          setTimeout(() => {
            setUploadProgress(0);
          }, 1000);
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Error uploading logo:', error);
        setError('Failed to upload logo');
        setUploadProgress(0);
      }
    }
  };

  const handleLogoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save site settings');
      }
      
      // Revalidate the pages that use site settings
      try {
        const pathsToRevalidate = ['/', '/about', '/contact', '/blog', '/projects'];
        
        for (const path of pathsToRevalidate) {
          const revalidateResponse = await fetch(`/api/revalidate?path=${path}`, {
            method: 'POST',
          });
          
          if (revalidateResponse.ok) {
            const revalidateResult = await revalidateResponse.json();
            console.log(`Revalidation result for ${path}:`, revalidateResult);
          } else {
            console.error(`Failed to revalidate ${path}:`, revalidateResponse.status);
          }
        }
      } catch (revalidateErr) {
        console.error('Error during revalidation:', revalidateErr);
      }
      
      setSaving(false);
      setSaveSuccess(true);
    } catch (err: any) {
      console.error('Error saving site settings:', err);
      setError(err.message || 'Failed to save site settings');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="text-center py-10">Loading site settings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Settings">
      <AdminPageLayout
        title="Site Settings"
        description="Customize your website's appearance and branding."
      >
        <AdminFormLayout onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          
          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
              Site settings updated successfully!
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Logo & Branding</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div 
                  className="mb-4 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center"
                  onClick={handleLogoClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative mb-3">
                    <Image
                      src={siteSettings.logoUrl}
                      alt="Website Logo"
                      fill
                      style={{ objectFit: 'contain' }}
                      className="p-2"
                    />
                  </div>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                    Click to upload a new logo
                  </p>
                  
                  {uploadProgress > 0 && (
                    <div className="w-full mt-3">
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-full md:w-2/3">
                <AdminInput
                  id="logoText"
                  label="Logo Text"
                  name="logoText"
                  value={siteSettings.logoText}
                  onChange={handleInputChange}
                  placeholder="Enter your name or brand"
                />
                
                <AdminTextarea
                  id="bioText"
                  label="Bio Text"
                  name="bioText"
                  value={siteSettings.bioText}
                  onChange={handleInputChange}
                  placeholder="Brief description about yourself"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Footer Settings</h3>
            <AdminInput
              id="footerText"
              label="Footer Text"
              name="footerText"
              value={siteSettings.footerText}
              onChange={handleInputChange}
              placeholder="e.g., Built with Next.js and Tailwind CSS"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </AdminFormLayout>
      </AdminPageLayout>
    </AdminLayout>
  );
} 