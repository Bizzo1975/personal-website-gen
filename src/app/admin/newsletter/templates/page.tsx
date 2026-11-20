'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { TEMPLATE_TYPES } from '@/components/admin/newsletter/TemplateForm';

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  is_system: boolean;
  usage_count: number | null;
  updated_at: string;
}

// W19: this list used to be hard-coded mock templates; it now reads the database.
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/newsletter/templates?include_inactive=true');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setTemplates(data.templates || []);
      setError('');
    } catch (e) {
      setError(`Could not load templates: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (t: TemplateRow) => {
    if (!window.confirm(`Delete the template "${t.name}"? This cannot be undone.`)) return;
    setMessage('');
    const res = await fetch(`/api/admin/newsletter/templates/${t.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? `Deleted "${t.name}".` : (data.error || `Not deleted (HTTP ${res.status})`));
    if (res.ok) await load();
  };

  const shown = (templates || []).filter((t) =>
    (type === 'all' || t.type === type) &&
    (!search || `${t.name} ${t.description || ''}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout title="Newsletter Templates">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Newsletter Templates</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {templates ? `${templates.length} template(s), ${templates.filter((t) => t.is_active).length} active` : 'Loading...'}
            </p>
          </div>
          <Link href="/admin/newsletter/templates/create" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <PlusIcon className="h-5 w-5 mr-2" /> Create template
          </Link>
        </div>

        <div className="flex gap-4 mb-6">
          <input
            aria-label="Search templates"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <select
            aria-label="Filter by type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All types</option>
            {TEMPLATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {error && <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        {message && <p role="status" className="mb-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>}

        {templates && shown.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {templates.length === 0 ? 'No templates yet.' : 'No templates match.'}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t.type}{t.is_system ? ' · system' : ''}{t.is_active ? '' : ' · inactive'}
                </span>
              </div>
              {t.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t.description}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Used {t.usage_count || 0} time(s) · updated {new Date(t.updated_at).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link href={`/admin/newsletter/templates/${t.id}/edit`} className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200">
                  <PencilIcon className="h-4 w-4 mr-1" /> {t.is_system ? 'View' : 'Edit'}
                </Link>
                <Link href={`/admin/newsletter/templates/${t.id}/preview`} className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200">
                  <EyeIcon className="h-4 w-4 mr-1" /> Preview
                </Link>
                {t.is_active && (
                  <Link href={`/admin/newsletter/campaigns/create?template=${t.id}`} className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Use in campaign
                  </Link>
                )}
                {!t.is_system && (
                  <button type="button" onClick={() => remove(t)} className="inline-flex items-center px-3 py-1.5 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
                    <TrashIcon className="h-4 w-4 mr-1" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
