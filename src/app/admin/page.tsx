'use client';

import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="text-center max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Admin Panel</h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Welcome to the admin panel. Please choose an option below.
          </p>
          
          <div className="space-y-3">
            <Link 
              href="/admin/login"
              className="block w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-md transition-colors font-medium"
            >
              Login to Admin Dashboard
            </Link>
            
            <Link 
              href="/admin/dashboard"
              className="block w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-md transition-colors font-medium"
            >
              Go to Dashboard (if logged in)
            </Link>
            
            <Link 
              href="/"
              className="block w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-md transition-colors font-medium"
            >
              Back to Website
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            <p>Default admin credentials:</p>
            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded mt-2 font-mono text-xs">
              Email: admin@example.com<br/>
              Password: admin12345
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 