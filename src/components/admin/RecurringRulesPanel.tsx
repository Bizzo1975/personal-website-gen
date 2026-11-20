'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowPathIcon, PencilIcon, TrashIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import type { RecurringContentRule } from './RecurringContentModal';

// Mirrors the recurring_content_rules row returned by /api/admin/recurring-content
interface RuleRow {
  id: string; name: string; content_type: 'post' | 'project' | 'newsletter'; template_content_id: string | null;
  template_title: string | null; recurrence_pattern: 'weekly' | 'monthly'; recurrence_day: number;
  recurrence_time: string; time_zone: string; is_active: boolean; next_scheduled_at: string | null;
  last_run_at: string | null; last_error: string | null; last_created_content_id: string | null;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const inZone = (iso: string | null, tz: string) => {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch { return new Date(iso).toLocaleString(); }
};

const editLink = (r: RuleRow) => {
  if (!r.last_created_content_id) return null;
  if (r.content_type === 'post') return `/admin/posts/${r.last_created_content_id}`;
  if (r.content_type === 'newsletter') return `/admin/newsletter/campaigns/${r.last_created_content_id}/edit`;
  return `/admin/projects/${r.last_created_content_id}`;
};

export const toModalRule = (r: RuleRow): RecurringContentRule => ({
  id: r.id, name: r.name, contentType: r.content_type, templateContentId: r.template_content_id || undefined,
  recurrencePattern: r.recurrence_pattern, recurrenceDay: r.recurrence_day,
  recurrenceTime: String(r.recurrence_time).slice(0, 5), timeZone: r.time_zone, isActive: r.is_active,
});

/** W26: the rules were saved but could not be seen, edited, paused or deleted anywhere. */
export default function RecurringRulesPanel({ refreshKey, onEdit }: { refreshKey: number; onEdit: (rule: RecurringContentRule) => void }) {
  const [rules, setRules] = useState<RuleRow[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/recurring-content');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRules(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(`Could not load recurring rules: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const setActive = async (r: RuleRow, isActive: boolean) => {
    const res = await fetch(`/api/admin/recurring-content/${r.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || `Not changed (HTTP ${res.status})`);
    await load();
  };

  const remove = async (r: RuleRow) => {
    if (!window.confirm(`Delete the recurring rule "${r.name}"? Drafts it already created are kept.`)) return;
    const res = await fetch(`/api/admin/recurring-content/${r.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || `Not deleted (HTTP ${res.status})`);
    await load();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <ArrowPathIcon className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recurring rules</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">each run creates a draft for review</span>
      </div>
      {error && <p role="alert" className="px-6 pt-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {rules && rules.length === 0 && <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">No recurring rules.</p>}
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {(rules || []).map((r) => {
          const when = r.recurrence_pattern === 'weekly'
            ? `Every ${WEEKDAYS[r.recurrence_day]}`
            : `Monthly on day ${r.recurrence_day}`;
          const link = editLink(r);
          return (
            <li key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {r.name} <span className="text-xs text-gray-500 dark:text-gray-400">({r.content_type}{r.is_active ? '' : ', paused'})</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {when} at {String(r.recurrence_time).slice(0, 5)} ({r.time_zone})
                  {r.template_title ? ` · copies "${r.template_title}"` : r.template_content_id ? ' · template missing' : ' · blank draft'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Next run: {r.is_active ? inZone(r.next_scheduled_at, r.time_zone) : 'paused'}
                  {r.last_run_at && (
                    <> · Last run {inZone(r.last_run_at, r.time_zone)}: {r.last_error
                      ? <span className="text-red-700 dark:text-red-300">failed: {r.last_error}</span>
                      : link ? <a className="text-blue-600 dark:text-blue-400 hover:underline" href={link}>draft created</a> : 'draft created'}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => onEdit(toModalRule(r))} title={`Edit ${r.name}`}>
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActive(r, !r.is_active)} title={r.is_active ? `Pause ${r.name}` : `Resume ${r.name}`}>
                  {r.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => remove(r)} title={`Delete ${r.name}`}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
