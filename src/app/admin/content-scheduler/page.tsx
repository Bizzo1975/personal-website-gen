'use client';

import React from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import ContentScheduler from '@/components/admin/ContentScheduler';

function ContentSchedulerPageContent() {
  return (
    <AdminPageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Content Scheduler
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Schedule posts and content for future publication
        </p>
      </div>

      <ContentScheduler />
    </AdminPageLayout>
  );
}

export default function ContentSchedulerPage() {
  return (
    <AdminLayout title="Content Scheduler">
      <ContentSchedulerPageContent />
    </AdminLayout>
  );
} 