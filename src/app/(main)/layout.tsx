'use client';

import React, { useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import AccessibilityEnhancements from '@/components/AccessibilityEnhancements';

// Define interfaces directly to avoid import issues
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

// Default site settings as fallback
const getDefaultSiteSettings = (): SiteSettings => ({
  logoUrl: '/images/jlk-logo.png',
  logoText: 'Jonathan L Keck',
  footerText: 'Built with Next.js and Tailwind CSS',
  bioText: 'Full-stack developer specializing in modern web technologies.',
  navbarStyle: 'default',
  navbarLinks: [
    { label: 'Home', url: '/', isExternal: false },
    { label: 'About', url: '/about', isExternal: false },
    { label: 'Projects', url: '/projects', isExternal: false },
    { label: 'Blog', url: '/blog', isExternal: false },
    { label: 'Contact', url: '/contact', isExternal: false },
  ]
});

export default function MainLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(getDefaultSiteSettings());
  const [loading, setLoading] = useState(true);

  // Fetch site settings on client side
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        console.log('🔄 Fetching site settings from API...');
        const response = await fetch('/api/site-settings', { 
          cache: 'no-store'
        });
        
        if (response.ok) {
          const settings = await response.json();
          console.log('✅ Site settings loaded - Logo URL:', settings.logoUrl);
          setSiteSettings(settings);
        } else {
          console.warn('Failed to fetch site settings, using defaults');
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSiteSettings();
  }, []);

  return (
    <AccessibilityEnhancements hideToolbar>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="fixed inset-0 bg-grid opacity-10 dark:opacity-5 z-0 pointer-events-none"></div>
        
        <Header siteSettings={siteSettings} />
        
        <main id="main-content" className="flex-grow z-10 relative" tabIndex={-1}>
          {children}
        </main>
        
        <Footer siteSettings={siteSettings} />
      </div>
    </AccessibilityEnhancements>
  );
} 