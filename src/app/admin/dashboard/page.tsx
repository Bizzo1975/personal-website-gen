'use client'
import '@/styles/globals.css';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import DashboardAnalytics from '@/components/admin/DashboardAnalytics';

function AdminDashboardContent() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{ name: string }>({ name: 'Admin User' });

  useEffect(() => {
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
    } finally {
      setLoading(false);
    }
  };

  // Extract first name from the profile name
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0] || 'Admin';
  };

  return (
    <AdminPageLayout>
      {/* Analytics Section */}
      <div>
        <DashboardAnalytics profileData={profileData} />
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