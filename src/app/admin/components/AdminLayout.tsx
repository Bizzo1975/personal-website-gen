'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BiHomeAlt, BiFileBlank, BiNews, BiCodeBlock, BiCog, BiEnvelope, BiUser, BiPlus } from 'react-icons/bi';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <BiHomeAlt className="w-5 h-5" /> },
    { href: '/admin/pages/home', label: 'Home Page', icon: <BiHomeAlt className="w-5 h-5" /> },
    { href: '/admin/pages/about', label: 'About Me', icon: <BiUser className="w-5 h-5" /> },
    { href: '/admin/contact', label: 'Contact', icon: <BiEnvelope className="w-5 h-5" /> },
    { href: '/admin/posts', label: 'Posts', icon: <BiNews className="w-5 h-5" /> },
    { href: '/admin/projects', label: 'Projects', icon: <BiCodeBlock className="w-5 h-5" /> },
    { href: '/admin/settings/profile', label: 'Settings', icon: <BiCog className="w-5 h-5" /> },
  ];
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 md:fixed md:h-screen bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        
        {/* Navigation Menu */}
        <nav className="p-4 flex-grow">
          <ul className="space-y-2">
            {navItems.map((item) => (
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
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
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
      
      {/* Main Content */}
      <div className="flex-1 md:ml-64 bg-slate-50 dark:bg-slate-900 min-h-screen">
        <header className="bg-white dark:bg-slate-800 shadow-sm">
          <div className="mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
} 