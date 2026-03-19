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
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  sendgridFromName?: string;
  sendgridReplyTo?: string;
  newsletterEnabled?: boolean;
  newsletterDoubleOptin?: boolean;
  accessRequestWelcomeEmailEnabled?: boolean;
  accessRequestWelcomeEmailSubject?: string;
  accessRequestWelcomeEmailMessage?: string;
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

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Newsletter Settings</h3>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 mb-6">
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="newsletterEnabled"
                    checked={siteSettings.newsletterEnabled ?? true}
                    onChange={(e) => setSiteSettings({
                      ...siteSettings,
                      newsletterEnabled: e.target.checked
                    })}
                    className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enable Newsletter System
                  </span>
                </label>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Allow visitors to subscribe to your newsletter
                </p>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="newsletterDoubleOptin"
                    checked={siteSettings.newsletterDoubleOptin ?? false}
                    onChange={(e) => setSiteSettings({
                      ...siteSettings,
                      newsletterDoubleOptin: e.target.checked
                    })}
                    className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Double Opt-in Required
                  </span>
                </label>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Require email confirmation before activating subscriptions
                </p>
              </div>
            </div>

            <h4 className="text-md font-semibold mb-4">SendGrid Configuration</h4>
            {!siteSettings.sendgridApiKey && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <p className="text-blue-800 dark:text-blue-200 font-medium">SendGrid Setup Required</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      To enable newsletter functionality, you need to configure SendGrid API credentials. 
                      <a href="https://sendgrid.com/docs/for-developers/sending-email/api-getting-started/" 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="underline hover:no-underline">
                        Learn how to get your API key
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {siteSettings.sendgridApiKey && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <p className="text-green-800 dark:text-green-200 font-medium">SendGrid Configured</p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      SendGrid is properly configured and ready to send emails.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminInput
                id="sendgridApiKey"
                label="SendGrid API Key"
                name="sendgridApiKey"
                type="password"
                value={siteSettings.sendgridApiKey || ''}
                onChange={handleInputChange}
                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                helpText="Your SendGrid API key for sending emails"
              />
              
              <AdminInput
                id="sendgridFromEmail"
                label="From Email Address"
                name="sendgridFromEmail"
                type="email"
                value={siteSettings.sendgridFromEmail || ''}
                onChange={handleInputChange}
                placeholder="noreply@yoursite.com"
                helpText="Email address newsletters will be sent from"
              />
              
              <AdminInput
                id="sendgridFromName"
                label="From Name"
                name="sendgridFromName"
                value={siteSettings.sendgridFromName || ''}
                onChange={handleInputChange}
                placeholder="Your Site Newsletter"
                helpText="Name that appears in the 'From' field"
              />
              
              <AdminInput
                id="sendgridReplyTo"
                label="Reply-To Email"
                name="sendgridReplyTo"
                type="email"
                value={siteSettings.sendgridReplyTo || ''}
                onChange={handleInputChange}
                placeholder="contact@yoursite.com"
                helpText="Email address for subscriber replies"
              />
            </div>

            {/* Access Request Welcome Email Configuration */}
            <div className="mt-8">
              <h4 className="text-md font-semibold mb-4">Access Request Welcome Email</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <p className="text-blue-800 dark:text-blue-200 font-medium">Welcome Email Configuration</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      When an access request is approved, a welcome email is automatically sent to the user. 
                      You can customize the email subject and message below. Use {"{"}userName{"}"}, {"{"}accessLevel{"}"}, and {"{"}websiteUrl{"}"} as placeholders.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="accessRequestWelcomeEmailEnabled"
                    name="accessRequestWelcomeEmailEnabled"
                    checked={siteSettings.accessRequestWelcomeEmailEnabled !== false}
                    onChange={(e) => handleInputChange({ target: { name: 'accessRequestWelcomeEmailEnabled', value: e.target.checked } } as any)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="accessRequestWelcomeEmailEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable welcome email on access request approval
                  </label>
                </div>

                <AdminInput
                  id="accessRequestWelcomeEmailSubject"
                  label="Welcome Email Subject"
                  name="accessRequestWelcomeEmailSubject"
                  type="text"
                  value={siteSettings.accessRequestWelcomeEmailSubject || 'Access Approved - Welcome to {accessLevel} content!'}
                  onChange={handleInputChange}
                  placeholder="Access Approved - Welcome to {accessLevel} content!"
                  helpText="Email subject line. Use {userName}, {accessLevel} as placeholders."
                />

                <div>
                  <label htmlFor="accessRequestWelcomeEmailMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Welcome Email Message (HTML)
                  </label>
                  <textarea
                    id="accessRequestWelcomeEmailMessage"
                    name="accessRequestWelcomeEmailMessage"
                    rows={8}
                    value={siteSettings.accessRequestWelcomeEmailMessage || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Custom HTML message. Use {userName}, {accessLevel}, {websiteUrl} as placeholders."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave empty to use default template. Available placeholders: {"{"}userName{"}"}, {"{"}accessLevel{"}"}, {"{"}websiteUrl{"}"}
                  </p>
                </div>
              </div>
            </div>
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