'use client';

/**
 * W21: create/edit a content template against /api/admin/templates (real saves).
 * Replaces the edit page whose Save waited a second and showed "saved" without saving.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { BiSave, BiTrash } from 'react-icons/bi';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import { templateVariables, type ContentTemplateDto, type TemplateType } from '@/lib/content-templates';

const BACK = '/admin/content-management?tab=templates';
const field =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function ContentTemplateForm({ id }: { id?: string }) {
  const router = useRouter();
  const [template, setTemplate] = useState<ContentTemplateDto | null>(null);
  const [form, setForm] = useState({ name: '', type: 'post' as TemplateType, description: '', content: '' });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/templates/${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.template) {
          setLoadError(res.status === 404 ? 'Template not found' : data.error || `Could not load the template (${res.status})`);
          return;
        }
        const t: ContentTemplateDto = data.template;
        setTemplate(t);
        setForm({ name: t.name, type: t.type, description: t.description ?? '', content: t.content });
      } catch {
        setLoadError('Could not load the template (network error)');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(id ? `/api/admin/templates/${id}` : '/api/admin/templates', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.template) {
        setMessage({ kind: 'error', text: data.error || `Save failed (${res.status})` });
        return;
      }
      if (!id) {
        router.push(`/admin/templates/${data.template.id}/edit?created=1`);
        return;
      }
      setTemplate(data.template);
      setMessage({ kind: 'ok', text: 'Template saved.' });
    } catch {
      setMessage({ kind: 'error', text: 'Save failed (network error). Nothing was saved.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id || !template) return;
    if (!window.confirm(`Delete the template "${template.name}"? Posts and projects made from it are not changed.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: 'error', text: data.error || `Delete failed (${res.status})` });
        return;
      }
      router.push(BACK);
    } catch {
      setMessage({ kind: 'error', text: 'Delete failed (network error).' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (id && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('created')) {
      setMessage({ kind: 'ok', text: 'Template created.' });
    }
  }, [id]);

  const title = id ? `Edit: ${template?.name ?? 'Template'}` : 'New Template';
  if (loading || loadError) {
    return (
      <AdminLayout title={title}>
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-lg" />
          ) : (
            <Card>
              <CardBody className="text-center py-12">
                <h3 className="text-lg font-medium mb-4">{loadError}</h3>
                <Button onClick={() => router.push(BACK)} variant="outline">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back to templates
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </AdminLayout>
    );
  }

  const variables = templateVariables(form.content);
  return (
    <AdminLayout title={title}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={() => router.push(BACK)} variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{id ? 'Edit Template' : 'New Template'}</h1>
          </div>
          <div className="flex items-center space-x-2">
            {id && (
              <>
                <Button onClick={() => router.push(`/admin/templates/${id}/preview`)} variant="outline" size="sm">
                  <EyeIcon className="h-4 w-4 mr-2" /> Preview
                </Button>
                <Button onClick={remove} variant="outline" size="sm" disabled={saving} className="text-red-600">
                  <BiTrash className="h-4 w-4 mr-2" /> Delete
                </Button>
              </>
            )}
            <Button onClick={save} variant="primary" size="sm" disabled={saving}>
              <BiSave className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : id ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>

        {message && (
          <div
            role={message.kind === 'error' ? 'alert' : 'status'}
            className={`rounded-lg p-3 text-sm border ${
              message.kind === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <Card>
          <CardHeader><h3 className="text-lg font-medium">Template Details</h3></CardHeader>
          <CardBody className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Name</span>
              <input className={field} value={form.name} maxLength={255} onChange={e => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Used for</span>
              <select className={field} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TemplateType })}>
                <option value="post">Blog posts</option>
                <option value="project">Projects</option>
                <option value="page">Pages (copy the text; pages have no "use template" button)</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</span>
              <textarea className={field} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </label>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Template Content (Markdown)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {'Placeholders such as {{title}} are copied as written; replace them in the new post or project.'}
            </p>
          </CardHeader>
          <CardBody>
            <textarea className={`${field} font-mono text-sm`} rows={20} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {variables.length ? `Placeholders: ${variables.join(', ')}` : 'No placeholders.'}
            </p>
          </CardBody>
        </Card>

        {template && (
          <Card>
            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="font-medium">Created:</span> {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Not recorded'}</div>
              <div><span className="font-medium">Used:</span> {template.usageCount} times</div>
              <div><span className="font-medium">Author:</span> {template.author || 'Not recorded'}</div>
            </CardBody>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
