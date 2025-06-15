'use client';

import React from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import BulkOperations from '@/components/admin/BulkOperations';

function BulkOperationsPageContent() {
  return (
    <AdminPageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Bulk Operations
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage multiple content items at once with bulk operations
        </p>
      </div>

      <BulkOperations />
    </AdminPageLayout>
  );
}

export default function BulkOperationsPage() {
  return (
    <AdminLayout title="Bulk Operations">
      <BulkOperationsPageContent />
    </AdminLayout>
  );
} 