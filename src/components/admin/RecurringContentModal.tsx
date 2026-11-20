'use client';

import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/Button';

export interface RecurringContentRule {
  id?: string;
  name: string;
  contentType: 'post' | 'project' | 'newsletter';
  templateContentId?: string;
  recurrencePattern: 'weekly' | 'monthly';
  recurrenceDay: number;
  recurrenceTime: string;
  timeZone: string;
  isActive: boolean;
}

interface RecurringContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Resolves to null on success, or the server's error message (the modal stays open). */
  onSave: (rule: RecurringContentRule) => Promise<string | null>;
  editingRule?: RecurringContentRule | null;
}

const browserTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
};

const blank = (): RecurringContentRule => ({
  name: '', contentType: 'post', recurrencePattern: 'weekly', recurrenceDay: 1,
  recurrenceTime: '09:00', timeZone: browserTimeZone(), isActive: true,
});

const input = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

// W26: creates rules that the scheduler turns into DRAFTS for review.
const RecurringContentModal: React.FC<RecurringContentModalProps> = ({ isOpen, onClose, onSave, editingRule }) => {
  const [rule, setRule] = useState<RecurringContentRule>(blank());
  const [options, setOptions] = useState<{ id: string; title: string; status: string }[]>([]);
  const [optionsError, setOptionsError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setRule(editingRule ? { ...editingRule } : blank()); setError(''); }
  }, [isOpen, editingRule]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/recurring-content/template-options?type=${rule.contentType}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        if (!cancelled) { setOptions(data.options || []); setOptionsError(''); }
      } catch (e) {
        if (!cancelled) setOptionsError(`Could not load templates: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, rule.contentType]);

  const set = <K extends keyof RecurringContentRule>(k: K, v: RecurringContentRule[K]) => setRule((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const problem = await onSave(rule);
      if (problem) setError(problem); else onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  const typeLabel = rule.contentType === 'newsletter' ? 'campaign' : rule.contentType;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5" />
            {editingRule ? 'Edit Recurring Content' : 'Create Recurring Content'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          On each run a new <strong>draft</strong> {typeLabel} is created for you to review. Nothing is published or sent automatically.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rule name
            <input type="text" className={`${input} mt-1`} value={rule.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g., Weekly roundup" required />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content type
            <select className={`${input} mt-1`} value={rule.contentType}
              onChange={(e) => setRule((p) => ({ ...p, contentType: e.target.value as RecurringContentRule['contentType'], templateContentId: undefined }))}>
              <option value="post">Post</option>
              <option value="project">Project</option>
              <option value="newsletter">Newsletter campaign</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Copy from (optional)
            <select className={`${input} mt-1`} value={rule.templateContentId || ''} onChange={(e) => set('templateContentId', e.target.value || undefined)}>
              <option value="">Nothing: start a blank draft titled with the rule name</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.title} ({o.status})</option>)}
            </select>
            {optionsError && <span className="block mt-1 text-xs text-red-700 dark:text-red-300">{optionsError}</span>}
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Repeats
            <select className={`${input} mt-1`} value={rule.recurrencePattern}
              onChange={(e) => {
                const pattern = e.target.value as RecurringContentRule['recurrencePattern'];
                setRule((p) => ({ ...p, recurrencePattern: pattern, recurrenceDay: pattern === 'weekly' ? 1 : 1 }));
              }}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {rule.recurrencePattern === 'weekly' ? 'Day of week' : 'Day of month'}
            <select className={`${input} mt-1`} value={rule.recurrenceDay} onChange={(e) => set('recurrenceDay', parseInt(e.target.value, 10))}>
              {rule.recurrencePattern === 'weekly'
                ? WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)
                : [...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{ordinal(i + 1)}</option>)}
            </select>
            {rule.recurrencePattern === 'monthly' && rule.recurrenceDay > 28 && (
              <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">In shorter months this runs on the last day of the month.</span>
            )}
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time
            <input type="time" className={`${input} mt-1`} value={rule.recurrenceTime} onChange={(e) => set('recurrenceTime', e.target.value)} required />
            <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">Time zone: {rule.timeZone}</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
            <input type="checkbox" checked={rule.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4" />
            Active
          </label>

          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingRule ? 'Update rule' : 'Create rule'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringContentModal;
