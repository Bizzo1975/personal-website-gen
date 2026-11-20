'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface TemplateValues {
  name: string;
  description: string;
  type: string;
  subjectTemplate: string;
  previewTextTemplate: string;
  htmlContent: string;
  plainTextContent: string;
  isActive: boolean;
}

export const EMPTY_TEMPLATE: TemplateValues = {
  name: '', description: '', type: 'custom', subjectTemplate: '', previewTextTemplate: '',
  htmlContent: '', plainTextContent: '', isActive: true,
};

export const TEMPLATE_TYPES = [
  { value: 'custom', label: 'Custom' },
  { value: 'digest', label: 'Digest' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'welcome', label: 'Welcome' },
];

const input = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500';

/** W19: create/edit form over the real templates API. Saves only on submit and shows the server's answer. */
export default function TemplateForm({ initial, templateId, readOnly }: { initial: TemplateValues; templateId?: string; readOnly?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<TemplateValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const set = (k: keyof TemplateValues, value: string | boolean) => { setV((p) => ({ ...p, [k]: value })); setSaved(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch(templateId ? `/api/admin/newsletter/templates/${templateId}` : '/api/admin/newsletter/templates', {
        method: templateId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || `Not saved (HTTP ${res.status})`); return; }
      if (!templateId && data.template?.id) { router.push(`/admin/newsletter/templates/${data.template.id}/edit?created=1`); return; }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Template details</h2>
        {readOnly && <p className="text-sm text-yellow-700 dark:text-yellow-300">This is a system template and cannot be changed.</p>}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *
          <input className={`${input} mt-1`} value={v.name} onChange={(e) => set('name', e.target.value)} required disabled={readOnly} />
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description
          <textarea className={`${input} mt-1`} rows={3} value={v.description} onChange={(e) => set('description', e.target.value)} disabled={readOnly} />
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type
          <select className={`${input} mt-1`} value={v.type} onChange={(e) => set('type', e.target.value)} disabled={readOnly}>
            {TEMPLATE_TYPES.some((t) => t.value === v.type) ? null : <option value={v.type}>{v.type}</option>}
            {TEMPLATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject line *
          <input className={`${input} mt-1`} value={v.subjectTemplate} onChange={(e) => set('subjectTemplate', e.target.value)} required disabled={readOnly} />
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preview text
          <input className={`${input} mt-1`} value={v.previewTextTemplate} onChange={(e) => set('previewTextTemplate', e.target.value)} disabled={readOnly} />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={v.isActive} onChange={(e) => set('isActive', e.target.checked)} disabled={readOnly} />
          Active (offered when creating a campaign)
        </label>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Content</h2>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">HTML *
          <textarea className={`${input} mt-1 font-mono text-xs`} rows={14} value={v.htmlContent} onChange={(e) => set('htmlContent', e.target.value)} required disabled={readOnly} />
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plain text version
          <textarea className={`${input} mt-1 font-mono text-xs`} rows={6} value={v.plainTextContent} onChange={(e) => set('plainTextContent', e.target.value)} disabled={readOnly} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        {saved && <p role="status" className="text-sm text-green-700 dark:text-green-300">Saved.</p>}
        {!readOnly && (
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
            {saving ? 'Saving...' : templateId ? 'Save changes' : 'Create template'}
          </button>
        )}
      </div>
    </form>
  );
}
