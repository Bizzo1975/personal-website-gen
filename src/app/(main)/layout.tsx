'use client';

import React, { useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import ModernNavbar from '@/components/ModernNavbar';
import AccessibilityEnhancements from '@/components/AccessibilityEnhancements';

import { ProfileData } from '@/lib/services/profile-service';
import { SiteSettings, getSiteSettings } from '@/lib/services/site-settings-service';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'John Doe',
    imageUrl: '',
    skills: [],
  });
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    logoUrl: '/images/wizard-icon.svg',
    logoText: 'John Doe',
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
  
  // Fetch profile data and site settings on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfileData(profileData);
        }
        
        // Fetch site settings
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <AccessibilityEnhancements>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        {/* Background decorative elements */}
        <div className="fixed inset-0 bg-grid opacity-10 dark:opacity-5 z-0 pointer-events-none"></div>
        
        {/* Modern Navbar */}
        <ModernNavbar siteSettings={siteSettings} />
        
        {/* Main content - Add padding top for the fixed navbar */}
        <main id="main-content" className="flex-grow z-10 relative mt-16 pt-4" tabIndex={-1}>
          {children}
        </main>
        
        {/* Footer with site settings */}
        <Footer 
          profileName={profileData.name}
          footerText={siteSettings.footerText}
          bioText={siteSettings.bioText}
          logoUrl={siteSettings.logoUrl}
        />
      </div>
    </AccessibilityEnhancements>
  );
} 