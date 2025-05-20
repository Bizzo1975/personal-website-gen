'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Allow access to login and signup pages without authentication
  if (pathname === '/admin/login' || pathname === '/admin/signup') {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/admin/login');
    return null;
  }

  // Check for admin role
  if (session.user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You don't have permission to access this area.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/pages/home', label: 'Home Page' },
    { href: '/admin/pages/about', label: 'About Me' },
    { href: '/admin/contact', label: 'Contact' },
    { href: '/admin/posts', label: 'Blog Posts' },
    { href: '/admin/projects', label: 'Projects' },
    { href: '/admin/settings/profile', label: 'Profile' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">Admin Panel</h2>
        </div>
        <nav className="p-4 flex-grow">
          <ul className="space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block p-2 rounded-md ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Add New Page Button at bottom */}
        <div className="p-4 border-t dark:border-gray-700">
          <Link 
            href="/admin/pages/new"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
          >
            <span>Add New Page</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
} 