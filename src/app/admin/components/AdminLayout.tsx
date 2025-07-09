'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BiHomeAlt, BiFile, BiNews, BiCodeBlock, BiCog, BiEnvelope, BiUser, BiPlus, BiImage, BiUserCircle, BiCalendarCheck, BiFolder, BiShield, BiUserPlus } from 'react-icons/bi';
import Header from '@/components/Header';
import { ProfileData } from '@/lib/services/profile-service';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface SiteSettings {
  logoUrl: string;
  logoText: string;
  footerText: string;
  bioText: string;
  navbarStyle: string;
  navbarLinks: Array<{
    label: string;
    url: string;
    isExternal: boolean;
  }>;
}

// Import the footer component here to avoid circular dependencies
import AdminFooter from './AdminFooter';

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Admin User',
    imageUrl: '',
    skills: [],
  });
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    logoUrl: '/images/jlk-logo.png',
    logoText: 'Jonathan L Keck',
    footerText: 'Built with Next.js and Tailwind CSS',
    bioText: 'Full-stack developer specializing in modern web technologies',
    navbarStyle: 'default',
    navbarLinks: []
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
        const settingsResponse = await fetch('/api/site-settings');
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSiteSettings(settingsData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  const navItems = [
    // Dashboard
    { href: '/admin/dashboard', label: 'Dashboard', icon: <BiHomeAlt className="w-5 h-5" /> },
    
    // Content Management - Main Pages
    { href: '/admin/pages/home', label: 'Home Page', icon: <BiHomeAlt className="w-5 h-5" /> },
    { href: '/admin/pages/about', label: 'About Me', icon: <BiUser className="w-5 h-5" /> },
    { href: '/admin/projects', label: 'Projects', icon: <BiCodeBlock className="w-5 h-5" /> },
    { href: '/admin/posts', label: 'Posts', icon: <BiNews className="w-5 h-5" /> },
    { href: '/admin/contact', label: 'Contact', icon: <BiEnvelope className="w-5 h-5" /> },
    
    // Newsletter Management
    { href: '/admin/newsletter', label: 'Newsletter', icon: <BiEnvelope className="w-5 h-5" /> },
    
    // Advanced Content Management
    { href: '/admin/content-management', label: 'Content Management', icon: <BiFile className="w-5 h-5" /> },
    { href: '/admin/content-scheduler', label: 'Content Scheduler', icon: <BiCalendarCheck className="w-5 h-5" /> },
    { href: '/admin/media-library', label: 'Media Library', icon: <BiFolder className="w-5 h-5" /> },
    
    // User Management
    { href: '/admin/users', label: 'User Management', icon: <BiUser className="w-5 h-5" /> },
    { href: '/admin/access-requests', label: 'Access Requests', icon: <BiUserPlus className="w-5 h-5" /> },
    { href: '/admin/security', label: 'Security & 2FA', icon: <BiShield className="w-5 h-5" /> },
    
    // Settings
    { href: '/admin/settings/profile', label: 'Profile Settings', icon: <BiUserCircle className="w-5 h-5" /> },
    { href: '/admin/settings/site', label: 'Site Settings', icon: <BiCog className="w-5 h-5" /> },
    
    // Additional Management
    { href: '/admin/slideshow', label: 'Slideshow', icon: <BiImage className="w-5 h-5" /> },
  ];
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Header */}
      <Header siteSettings={siteSettings} />
      
      {/* Admin Content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 md:sticky md:top-[76px] md:h-[calc(100vh-76px)] bg-slate-800 text-white flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <Link href="/admin/dashboard" className="flex items-center space-x-3 group">
              <div className="w-14 h-14 relative">
                <Image 
                  src={siteSettings.logoUrl} 
                  alt="Logo" 
                  fill 
                  sizes="56px" 
                  style={{ objectFit: 'contain' }}
                  className="transition-transform group-hover:scale-110"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white group-hover:text-primary-300 transition-colors">
                  {siteSettings.logoText}
                </h1>
                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                  Admin Dashboard
                </p>
              </div>
            </Link>
          </div>
          
          {/* Navigation Menu */}
          <nav className="p-4 flex-grow overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item, index) => {
                // Add visual separation before Settings and Additional Management sections
                const showSeparator = index === 7 || index === 9; // Before Settings and Additional Management
                
                return (
                  <React.Fragment key={item.href}>
                    {showSeparator && (
                      <li className="py-2">
                        <hr className="border-slate-600" />
                      </li>
                    )}
                    <li>
                      <Link 
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary-600 text-white'
                            : 'hover:bg-slate-700'
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          </nav>
          
          {/* Add New Page Button at bottom */}
          <div className="p-4 border-t border-slate-700">
            <Link 
              href="/admin/pages/new"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              <BiPlus className="w-5 h-5" />
              <span>Add New Page</span>
            </Link>
          </div>
        </div>
        
        {/* Main Content with 20% grey background */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-800 min-h-screen">
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <AdminFooter />
    </div>
  );
} 