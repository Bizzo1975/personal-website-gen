import React from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import AccessibilityEnhancements from '@/components/AccessibilityEnhancements';
import { getSiteSettings } from '@/lib/services/site-settings-service';

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

export default async function MainLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Fetch site settings from database
  const siteSettings: SiteSettings = await getSiteSettings();

  return (
    <AccessibilityEnhancements>
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