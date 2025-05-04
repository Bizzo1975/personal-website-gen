'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  const stats = [
    { title: 'Pages', count: '2', href: '/admin/pages' },
    { title: 'Blog Posts', count: '5', href: '/admin/posts' },
    { title: 'Projects', count: '4', href: '/admin/projects' },
    { title: 'Users', count: '1', href: '/admin/settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="text-gray-600 dark:text-gray-300">
          Welcome, {session?.user?.name}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} variant="default" className="hover:shadow-md transition-shadow">
            <CardBody className="flex flex-col items-center py-6">
              <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">{stat.title}</h2>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4">{stat.count}</p>
              <Link 
                href={stat.href}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium" 
              >
                View all &rarr;
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="bordered">
          <CardHeader>
            <h3 className="text-lg font-medium">Pages</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">Manage your static pages or edit content.</p>
              <div className="flex space-x-3">
                <Link 
                  href="/admin/pages" 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Edit Pages
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <h3 className="text-lg font-medium">Blog Posts</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">Manage your blog posts or create a new one.</p>
              <div className="flex space-x-3">
                <Link 
                  href="/admin/posts/new" 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Create New Post
                </Link>
                <Link 
                  href="/admin/posts" 
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Manage Posts
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <h3 className="text-lg font-medium">Projects</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">Manage your portfolio projects or create a new one.</p>
              <div className="flex space-x-3">
                <Link 
                  href="/admin/projects/new" 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Create New Project
                </Link>
                <Link 
                  href="/admin/projects" 
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Manage Projects
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 