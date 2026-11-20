'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/app/admin/components/AdminLayout';
import TemplateForm, { TemplateValues } from '@/components/admin/newsletter/TemplateForm';

// W19: this page used to show hard-coded values ("Clean & Simple") and could not save.
export default function TemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<TemplateValues | null>(null);
  const [isSystem, setIsSystem] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  useEffect(() => {
    setCreated(new URLSearchParams(window.location.search).get('created') === '1');
    (async () => {
      try {
        const res = await fetch(`/api/admin/newsletter/templates/${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        const t = data.template;
        setIsSystem(Boolean(t.is_system));
        setInitial({
          name: t.name || '',
          description: t.description || '',
          type: t.type || 'custom',
          subjectTemplate: t.subject_template || '',
          previewTextTemplate: t.preview_text_template || '',
          htmlContent: t.html_content || '',
          plainTextContent: t.plain_text_content || '',
          isActive: t.is_active !== false,
        });
      } catch (e) {
        setError(`Could not load the template: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
  }, [id]);

  return (
    <AdminLayout title="Edit Template">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/admin/newsletter/templates" className="mr-4 p-2 text-gray-600 hover:text-gray-800" aria-label="Back to templates">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Template</h1>
          </div>
          <Link href={`/admin/newsletter/templates/${id}/preview`} className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
            <EyeIcon className="h-5 w-5 mr-2" /> Preview
          </Link>
        </div>
        {created && <p role="status" className="mb-4 text-sm text-green-700 dark:text-green-300">Template created.</p>}
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        {!error && !initial && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
        {initial && <TemplateForm initial={initial} templateId={id} readOnly={isSystem} />}
      </div>
    </AdminLayout>
  );
}
