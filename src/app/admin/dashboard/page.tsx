'use client'
import '@/styles/globals.css';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Link from 'next/link';
import { 
  BiPlus, 
  BiCalendarCheck, 
  BiSelectMultiple, 
  BiHistory, 
  BiFolder, 
  BiUser, 
  BiShield,
  BiDownload,
  BiUpload,
  BiCog,
  BiBarChart
} from 'react-icons/bi';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import DashboardAnalytics from '@/components/admin/DashboardAnalytics';
import ContentScheduler from '@/components/admin/ContentScheduler';
import BulkOperations from '@/components/admin/BulkOperations';

function AdminDashboardContent() {
  const { data: session } = useSession();
  const [blogCount, setBlogCount] = useState<string>('5');
  const [projectCount, setProjectCount] = useState<string>('4');
  const [userCount, setUserCount] = useState<string>('1');
  const [scheduledCount, setScheduledCount] = useState<string>('0');
  const [draftCount, setDraftCount] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'users' | 'analytics'>('overview');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch various statistics for the dashboard
      const [blogRes, projectRes, userRes, scheduledRes, draftRes] = await Promise.all([
        fetch('/api/admin/stats/posts'),
        fetch('/api/admin/stats/projects'),
        fetch('/api/admin/stats/users'),
        fetch('/api/admin/stats/scheduled'),
        fetch('/api/admin/stats/drafts')
      ]);

      if (blogRes.ok) {
        const blogData = await blogRes.json();
        setBlogCount(blogData.count.toString());
      }
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProjectCount(projectData.count.toString());
      }
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserCount(userData.count.toString());
      }
      if (scheduledRes.ok) {
        const scheduledData = await scheduledRes.json();
        setScheduledCount(scheduledData.count.toString());
      }
      if (draftRes.ok) {
        const draftData = await draftRes.json();
        setDraftCount(draftData.count.toString());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: 'Blog Posts', count: blogCount, href: '/admin/posts', icon: <BiBarChart /> },
    { title: 'Projects', count: projectCount, href: '/admin/projects', icon: <BiFolder /> },
    { title: 'Users', count: userCount, href: '/admin/users', icon: <BiUser /> },
    { title: 'Scheduled', count: scheduledCount, href: '/admin/scheduled', icon: <BiCalendarCheck /> },
    { title: 'Drafts', count: draftCount, href: '/admin/drafts', icon: <BiHistory /> },
  ];

  const adminFeatures = [
    {
      title: 'Content Scheduling',
      description: 'Schedule posts and content for future publication',
      href: '/admin/content-scheduler',
      icon: <BiCalendarCheck className="w-6 h-6" />,
      color: 'blue'
    },
    {
      title: 'Bulk Operations',
      description: 'Manage multiple content items at once',
      href: '/admin/bulk-operations',
      icon: <BiSelectMultiple className="w-6 h-6" />,
      color: 'green'
    },
    {
      title: 'Content Versioning',
      description: 'Track and manage content history',
      href: '/admin/content-versioning',
      icon: <BiHistory className="w-6 h-6" />,
      color: 'purple'
    },
    {
      title: 'Media Library',
      description: 'Manage images and media files',
      href: '/admin/media-library',
      icon: <BiFolder className="w-6 h-6" />,
      color: 'orange'
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/admin/user-management',
      icon: <BiUser className="w-6 h-6" />,
      color: 'red'
    },
    {
      title: 'Security & 2FA',
      description: 'Two-factor authentication and security settings',
      href: '/admin/security',
      icon: <BiShield className="w-6 h-6" />,
      color: 'indigo'
    }
  ];

  const quickActions = [
    {
      title: 'Import Content',
      description: 'Import posts and content from external sources',
      action: () => window.open('/admin/import', '_blank'),
      icon: <BiUpload className="w-5 h-5" />,
      variant: 'outline'
    },
    {
      title: 'Export Content',
      description: 'Export all content as backup',
      action: () => window.open('/api/admin/export', '_blank'),
      icon: <BiDownload className="w-5 h-5" />,
      variant: 'outline'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      action: () => window.open('/admin/system-settings', '_blank'),
      icon: <BiCog className="w-5 h-5" />,
      variant: 'outline'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
      green: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
      purple: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
      orange: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
      red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <AdminPageLayout>
      {/* Welcome message */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome back, {session?.user?.name}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Here's what's happening with your website today.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'content', label: 'Content Management' },
            { key: 'users', label: 'User Management' },
            { key: 'analytics', label: 'Analytics' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} variant="default" className="hover:shadow-md transition-shadow">
                <CardBody className="flex flex-col items-center py-6">
                  <div className="text-primary-600 dark:text-primary-400 mb-2">
                    {stat.icon}
                  </div>
                  <h2 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">{stat.title}</h2>
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

          {/* Admin Features Grid */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Advanced Admin Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminFeatures.map((feature, index) => (
                <Link key={index} href={feature.href}>
                  <Card className={`hover:shadow-lg transition-all duration-200 border-2 ${getColorClasses(feature.color)}`}>
                    <CardBody className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                          <p className="text-sm opacity-90">{feature.description}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <Card key={index} variant="bordered" className="hover:shadow-md transition-shadow">
                  <CardBody className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-slate-600 dark:text-slate-400">
                        {action.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{action.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={action.action}
                      className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Execute
                    </button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Content Scheduling
            </h3>
            <ContentScheduler />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Bulk Operations
            </h3>
            <BulkOperations />
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="bordered">
              <CardHeader>
                <h3 className="text-lg font-medium">User Management</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-300">Manage user accounts, roles, and permissions.</p>
                  <div className="flex space-x-3">
                    <Link 
                      href="/admin/users" 
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Manage Users
                    </Link>
                    <Link 
                      href="/admin/roles" 
                      className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Manage Roles
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <h3 className="text-lg font-medium">Security Settings</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-300">Configure security settings and two-factor authentication.</p>
                  <div className="flex space-x-3">
                    <Link 
                      href="/admin/security/2fa" 
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Setup 2FA
                    </Link>
                    <Link 
                      href="/admin/security/activity" 
                      className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Activity Log
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <DashboardAnalytics />
        </div>
      )}
    </AdminPageLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Dashboard">
      <AdminDashboardContent />
    </AdminLayout>
  );
} 