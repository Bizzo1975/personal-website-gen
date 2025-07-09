'use client'
import '@/styles/globals.css';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Card, { CardBody } from '@/components/Card';
import Link from 'next/link';
import { 
  BiBarChart,
  BiFolder,
  BiUser,
  BiEnvelope,
  BiCalendarCheck,
  BiHistory
} from 'react-icons/bi';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import DashboardAnalytics from '@/components/admin/DashboardAnalytics';

function AdminDashboardContent() {
  const { data: session } = useSession();
  const [blogCount, setBlogCount] = useState<string>('0');
  const [projectCount, setProjectCount] = useState<string>('0');
  const [userCount, setUserCount] = useState<string>('0');
  const [scheduledCount, setScheduledCount] = useState<string>('0');
  const [draftCount, setDraftCount] = useState<string>('0');
  const [subscriberCount, setSubscriberCount] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{ name: string }>({ name: 'Admin User' });

  useEffect(() => {
    fetchDashboardStats();
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
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

  // Extract first name from the profile name
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0] || 'Admin';
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch various statistics for the dashboard
      const [blogRes, projectRes, userRes, scheduledRes, draftRes, subscriberRes] = await Promise.all([
        fetch('/api/admin/stats/posts'),
        fetch('/api/admin/stats/projects'),
        fetch('/api/admin/stats/users'),
        fetch('/api/admin/stats/scheduled'),
        fetch('/api/admin/stats/drafts'),
        fetch('/api/newsletter/admin/stats')
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
      if (subscriberRes.ok) {
        const subscriberData = await subscriberRes.json();
        setSubscriberCount(subscriberData.totalSubscribers ? subscriberData.totalSubscribers.toString() : '0');
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
    { title: 'Subscribers', count: subscriberCount, href: '/admin/newsletter/subscribers', icon: <BiEnvelope /> },
    { title: 'Scheduled', count: scheduledCount, href: '/admin/scheduled', icon: <BiCalendarCheck /> },
    { title: 'Drafts', count: draftCount, href: '/admin/drafts', icon: <BiHistory /> },
  ];

  return (
    <AdminPageLayout>
      {/* Welcome message */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome back, {getFirstName(profileData.name)}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Here's what's happening with your website today.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
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

        {/* Analytics Section */}
        <div>
          <DashboardAnalytics />
        </div>
      </div>
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