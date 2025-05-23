'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import AdminPageLayout from '../../components/AdminPageLayout';
import AdminFormLayout from '../../components/AdminFormLayout';
import { AdminInput, AdminTextarea } from '../../components/AdminFormField';
import { SiteSettings, getSiteSettings, updateSiteSettings, uploadLogo } from '@/lib/services/site-settings-service';

export default function SiteSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<SiteSettings>({
    logoUrl: '/images/wizard-icon.svg',
    logoText: 'John Doe',
    footerText: 'Built with Next.js and Tailwind CSS',
    bioText: 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.',
    navbarStyle: 'default',
    navbarLinks: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch the site settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        setSettings(data);
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
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        setUploadProgress(1); // Start progress
        const result = await uploadLogo(file);
        setUploadProgress(100); // Complete progress
        
        setSettings({
          ...settings,
          logoUrl: result.path
        });
        
        // Reset progress after a delay
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
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
      await updateSiteSettings(settings);
      
      // Revalidate the pages that use site settings
      try {
        // Array of paths to revalidate
        const pathsToRevalidate = ['/', '/about', '/contact', '/blog', '/projects'];
        
        // Revalidate all paths sequentially
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
                      src={settings.logoUrl}
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
                  value={settings.logoText}
                  onChange={handleInputChange}
                  placeholder="Enter the text to display next to your logo"
                  required
                />
                
                <div className="mb-4">
                  <label htmlFor="footerText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Footer Text
                  </label>
                  <textarea
                    id="footerText"
                    name="footerText"
                    value={settings.footerText}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md resize-y bg-white dark:bg-slate-800"
                    placeholder="Enter the text to display in the footer. This can be a longer paragraph describing your site, copyright info, etc."
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    This text appears in the footer of every page. You can include a brief description or copyright information.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="bioText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bio Text
                  </label>
                  <textarea
                    id="bioText"
                    name="bioText"
                    value={settings.bioText}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md resize-y bg-white dark:bg-slate-800"
                    placeholder="Enter your bio or about text to display in the footer. This should be a brief professional description."
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    This bio appears in the footer and describes you or your business. Keep it concise but informative.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Navigation Style</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['default', 'transparent', 'sticky'].map((style) => (
                <div 
                  key={style}
                  onClick={() => setSettings({ ...settings, navbarStyle: style })}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    settings.navbarStyle === style 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{style}</h4>
                    {settings.navbarStyle === style && (
                      <span className="text-primary-600 dark:text-primary-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 h-12 rounded-md overflow-hidden relative">
                    <div className={`absolute top-0 left-0 right-0 h-10 ${
                      style === 'transparent' 
                        ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur' 
                        : style === 'sticky' 
                        ? 'bg-white dark:bg-slate-900 shadow-md' 
                        : 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800'
                    }`}>
                      <div className="mx-2 h-full flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                        <div className="h-1.5 w-10 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-md transition-colors"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </AdminFormLayout>
      </AdminPageLayout>
    </AdminLayout>
  );
} 