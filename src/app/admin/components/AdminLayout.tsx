'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BiHomeAlt, BiFileBlank, BiNews, BiCodeBlock, BiCog, BiEnvelope, BiUser, BiPlus, BiImage, BiUserCircle } from 'react-icons/bi';
import Header from '@/components/Header';
import { ProfileData } from '@/lib/services/profile-service';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
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
  
  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };
    
    fetchProfile();
  }, []);
  
  const navItems = [
    // Dashboard
    { href: '/admin/dashboard', label: 'Dashboard', icon: <BiHomeAlt className="w-5 h-5" /> },
    
    // Content Management
    { href: '/admin/pages/home', label: 'Home Page', icon: <BiHomeAlt className="w-5 h-5" /> },
    { href: '/admin/pages/about', label: 'About Me', icon: <BiUser className="w-5 h-5" /> },
    { href: '/admin/contact', label: 'Contact', icon: <BiEnvelope className="w-5 h-5" /> },
    { href: '/admin/posts', label: 'Posts', icon: <BiNews className="w-5 h-5" /> },
    { href: '/admin/projects', label: 'Projects', icon: <BiCodeBlock className="w-5 h-5" /> },
    
    // Slideshow Management
    { href: '/admin/slideshow', label: 'Slideshow', icon: <BiImage className="w-5 h-5" /> },
    
    // Settings
    { href: '/admin/settings/profile', label: 'Profile Settings', icon: <BiUserCircle className="w-5 h-5" /> },
    { href: '/admin/settings/site', label: 'Site Settings', icon: <BiCog className="w-5 h-5" /> },
  ];
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Header */}
      <Header profileName={profileData.name} />
      
      {/* Admin Content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 md:sticky md:top-[76px] md:h-[calc(100vh-76px)] bg-slate-800 text-white flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          
          {/* Navigation Menu */}
          <nav className="p-4 flex-grow overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item, index) => {
                // Add visual separation before slideshow and settings sections
                const showSeparator = index === 5 || index === 7; // Before Slideshow and Settings
                
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
      <div className="mt-auto">
        <AdminFooter profileData={profileData} />
      </div>
    </div>
  );
} 