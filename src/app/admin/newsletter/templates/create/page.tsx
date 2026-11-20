'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/app/admin/components/AdminLayout';
import TemplateForm, { EMPTY_TEMPLATE } from '@/components/admin/newsletter/TemplateForm';

// W19: this page used to be a static form with no save.
export default function CreateTemplatePage() {
  return (
    <AdminLayout title="Create Template">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Link href="/admin/newsletter/templates" className="mr-4 p-2 text-gray-600 hover:text-gray-800" aria-label="Back to templates">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Template</h1>
        </div>
        <TemplateForm initial={EMPTY_TEMPLATE} />
      </div>
    </AdminLayout>
  );
}
