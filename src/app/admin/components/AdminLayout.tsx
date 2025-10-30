'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BiHomeAlt, BiFile, BiNews, BiCodeBlock, BiCog, BiEnvelope, BiUser, BiImage, BiUserCircle, BiCalendarCheck, BiFolder, BiShield, BiUserPlus, BiChevronDown, BiChevronRight, BiTransfer } from 'react-icons/bi';
import Header from '@/components/Header';
import AdminFooter from '@/app/admin/components/AdminFooter';
import { ProfileData } from '@/lib/services/profile-service';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

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
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  authorName: string;
  authorEmail: string;
  authorBio: string;
  socialLinks: {
    twitter: string;
    github: string;
    linkedin: string;
    instagram: string;
  };
  seoSettings: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    ogImage: string;
  };
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isPageContentCollapsed, setIsPageContentCollapsed] = useState(true);

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSiteSettings(data);
        }
      } catch (error) {
      console.error('Failed to fetch site settings:', error);
      }
    };
    
  if (!siteSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Group navigation items
  const dashboardItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <BiHomeAlt className="w-5 h-5" /> },
  ];
    
  const pageContentItems = [
    { href: '/admin/pages/home', label: 'Home Page', icon: <BiHomeAlt className="w-5 h-5" /> },
    { href: '/admin/pages/about', label: 'About Me', icon: <BiUser className="w-5 h-5" /> },
    { href: '/admin/projects', label: 'Projects', icon: <BiCodeBlock className="w-5 h-5" /> },
    { href: '/admin/posts', label: 'Posts', icon: <BiNews className="w-5 h-5" /> },
    { href: '/admin/contact', label: 'Contact', icon: <BiEnvelope className="w-5 h-5" /> },
    { href: '/admin/newsletter', label: 'Newsletter', icon: <BiEnvelope className="w-5 h-5" /> },
  ];
    
  const managementItems = [
    { href: '/admin/content-management', label: 'Content Management', icon: <BiFile className="w-5 h-5" /> },
    { href: '/admin/content-scheduler', label: 'Content Scheduler', icon: <BiCalendarCheck className="w-5 h-5" /> },
    { href: '/admin/media-library', label: 'Media Library', icon: <BiFolder className="w-5 h-5" /> },
    { href: '/admin/subscribers', label: 'Subscriber Management', icon: <BiUser className="w-5 h-5" /> },
  ];
    
  const userManagementItems = [
    { href: '/admin/users', label: 'User Management', icon: <BiUser className="w-5 h-5" /> },
    { href: '/admin/access-requests', label: 'Access Requests', icon: <BiUserPlus className="w-5 h-5" /> },
    { href: '/admin/security', label: 'Security & 2FA', icon: <BiShield className="w-5 h-5" /> },
  ];
    
  const settingsItems = [
    { href: '/admin/settings/profile', label: 'Profile Settings', icon: <BiUserCircle className="w-5 h-5" /> },
    { href: '/admin/settings/site', label: 'Site Settings', icon: <BiCog className="w-5 h-5" /> },
  ];
    
  const additionalItems = [
    { href: '/admin/slideshow', label: 'Slideshow', icon: <BiImage className="w-5 h-5" /> },
  ];
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const renderNavItems = (items: typeof dashboardItems) => (
    items.map((item) => (
      <li key={item.href}>
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
    ))
  );

  const renderCollapsibleSection = (title: string, items: typeof pageContentItems, isCollapsed: boolean, toggleFn: () => void) => (
    <>
      <li>
        <button
          onClick={toggleFn}
          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-700 rounded-md transition-colors"
        >
          <span className="text-sm font-medium text-slate-300">{title}</span>
          {isCollapsed ? (
            <BiChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <BiChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </li>
      {!isCollapsed && (
        <>
          {items.map((item) => (
            <li key={item.href} className="pl-4">
              <Link 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-slate-700'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </>
      )}
    </>
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Header */}
      <Header siteSettings={siteSettings} />
      
      {/* Admin Content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 md:sticky md:top-[76px] md:h-[calc(100vh-76px)] bg-slate-800 text-white flex flex-col">
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {/* Dashboard */}
              {renderNavItems(dashboardItems)}
              
              {/* Page Content - Collapsible */}
              {renderCollapsibleSection('Page Content', pageContentItems, isPageContentCollapsed, () => setIsPageContentCollapsed(!isPageContentCollapsed))}
              
              {/* Separator */}
              <li className="py-2">
                <hr className="border-slate-600" />
              </li>
              
              {/* Management */}
              {renderNavItems(managementItems)}
              
              {/* Separator */}
                      <li className="py-2">
                        <hr className="border-slate-600" />
                      </li>
              
              {/* User Management */}
              {renderNavItems(userManagementItems)}
              
              {/* Separator */}
              <li className="py-2">
                <hr className="border-slate-600" />
                    </li>
              
              {/* Settings */}
              {renderNavItems(settingsItems)}
              
              {/* Additional */}
              {renderNavItems(additionalItems)}
            </ul>
          </nav>
        </div>
        
        {/* Main Content with 20% grey background */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 min-h-full">
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