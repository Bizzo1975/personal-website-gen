'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Use useEffect for client-side redirects - MUST be called on every render
  useEffect(() => {
    // Only redirect if we're not on login/signup pages and user is unauthenticated
    if (status === 'unauthenticated' && pathname !== '/admin/login' && pathname !== '/admin/signup') {
      router.push('/admin/login');
    }
  }, [status, router, pathname]);

  // NOW we can do conditional rendering AFTER all hooks are called
  // Allow access to login and signup pages without authentication
  if (pathname === '/admin/login' || pathname === '/admin/signup') {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check for admin role
  if (session && session.user.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Access Denied</h1>
        <p className="mb-4 text-slate-600 dark:text-slate-400">You don't have permission to access this area.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  // Return the children - the actual AdminLayout component handles the UI
  return <>{children}</>;
} 