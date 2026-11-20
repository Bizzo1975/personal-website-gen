'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import { toDateTimeLocalValue, fromDateTimeLocalValue } from '@/lib/datetime-local';
import CalendarView, { ScheduledContentItem } from './CalendarView';
import RecurringContentModal, { type RecurringContentRule } from './RecurringContentModal';
import RecurringRulesPanel from './RecurringRulesPanel';

/** Server error text for a failed request (W11-style: show it, don't swallow it). */
async function failureText(res: Response, what: string): Promise<string> {
  const data = await res.json().catch(() => ({} as { error?: string }));
  return `${what}: ${data?.error || `HTTP ${res.status}`}`;
}

interface ScheduledPost {
  id: string;
  title: string;
  slug: string;
  scheduledDate: string;
  status: 'scheduled' | 'published' | 'failed';
  type: 'post' | 'project' | 'newsletter';
  author: string;
  excerpt?: string;
  recurringRuleId?: string;
  isRecurring?: boolean;
}

type ViewMode = 'list' | 'calendar';

const ContentScheduler: React.FC = () => {
  const [scheduledContent, setScheduledContent] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ScheduledPost | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null);
  const [editingRule, setEditingRule] = useState<RecurringContentRule | null>(null);
  const [rulesRefresh, setRulesRefresh] = useState(0);
  const [actionError, setActionError] = useState('');

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('contentSchedulerView') as ViewMode;
    if (savedView && (savedView === 'list' || savedView === 'calendar')) {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  useEffect(() => {
    localStorage.setItem('contentSchedulerView', viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchScheduledContent();
  }, []);

  const fetchScheduledContent = async () => {
    try {
      const response = await fetch('/api/admin/scheduled-content');
      if (!response.ok) { setActionError(await failureText(response, 'Could not load scheduled content')); return; }
      const data = await response.json();
      setScheduledContent(data);
    } catch (error) {
      setActionError(`Could not load scheduled content: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Each action reports the server's real answer instead of failing silently.
  const run = async (what: string, request: () => Promise<Response>): Promise<boolean> => {
    setActionError('');
    try {
      const response = await request();
      if (!response.ok) { setActionError(await failureText(response, what)); return false; }
      await fetchScheduledContent();
      return true;
    } catch (error) {
      setActionError(`${what}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };

  const handleSchedule = async (contentId: string, scheduledDate: string) => {
    const ok = await run('Not scheduled', () => fetch('/api/admin/schedule-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, scheduledDate })
    }));
    if (ok) {
      setShowScheduleModal(false);
      setPreselectedDate(null);
    }
  };

  const handleUnschedule = async (scheduleId: string) => {
    await run('Not unscheduled', () => fetch(`/api/admin/scheduled-content/${scheduleId}`, { method: 'DELETE' }));
  };

  const handlePublishNow = async (scheduleId: string) => {
    await run('Not published', () => fetch(`/api/admin/publish-now/${scheduleId}`, { method: 'POST' }));
  };

  const handleReschedule = async (contentId: string, newDate: string) => {
    await run('Not rescheduled', () => fetch(`/api/admin/scheduled-content/${contentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledDate: newDate })
    }));
  };

  const handleScheduleContent = (selectedDate?: Date) => {
    if (selectedDate) {
      setPreselectedDate(selectedDate);
    }
    setShowScheduleModal(true);
  };

  const handleEditContent = (content: ScheduledContentItem) => {
    setSelectedContent(content);
  };

  // W26: returns null on success or the server's error, which the modal shows.
  const handleSaveRecurringRule = async (rule: RecurringContentRule): Promise<string | null> => {
    try {
      const url = rule.id ? `/api/admin/recurring-content/${rule.id}` : '/api/admin/recurring-content';
      const response = await fetch(url, {
        method: rule.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({} as { error?: string }));
        return data?.error || `Not saved (HTTP ${response.status})`;
      }
      setRulesRefresh((n) => n + 1);
      setEditingRule(null);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Not saved';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'calendar' : 'list');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Scheduler</h2>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={toggleViewMode}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
              List
            </button>
            <button
              onClick={toggleViewMode}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4" />
              Calendar
            </button>
          </div>
          
          <Button variant="outline" onClick={() => { setEditingRule(null); setShowRecurringModal(true); }}>
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Recurring Content
          </Button>
          
          {/* Create New Content Dropdown */}
          <div className="relative inline-block">
            <Button 
              variant="primary"
              onClick={() => window.location.href = '/admin/projects/new'}
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Create & Schedule Project
            </Button>
          </div>
          
          <Button 
            variant="primary"
            onClick={() => window.location.href = '/admin/posts/new'}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Create & Schedule Post
          </Button>
          
          <Button variant="outline" onClick={() => handleScheduleContent()}>
            <CalendarIcon className="h-5 w-5 mr-2" />
            Schedule Existing Content
          </Button>
        </div>
      </div>

      {actionError && (
        <div role="alert" className="flex items-start justify-between gap-4 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError('')} className="underline">Dismiss</button>
        </div>
      )}

      {/* Render List or Calendar View */}
      {viewMode === 'list' ? (
        /* Scheduled Content List */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {scheduledContent.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No scheduled content</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Schedule posts and projects for future publication
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {scheduledContent.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                              {item.title}
                            </h3>
                            {item.isRecurring && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <ArrowPathIcon className="h-3 w-3" />
                                Recurring
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            /{item.slug}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(item.scheduledDate)}
                        </div>
                        <div className="flex items-center">
                          <span className="capitalize">{item.type}</span>
                        </div>
                        <div className="flex items-center">
                          <span>by {item.author}</span>
                        </div>
                      </div>

                      {item.excerpt && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {item.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>

                      <div className="flex items-center space-x-2">
                        {item.status === 'scheduled' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishNow(item.id)}
                            >
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedContent(item)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnschedule(item.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <CalendarView
          scheduledContent={scheduledContent}
          onReschedule={handleReschedule}
          onEditContent={handleEditContent}
          onDeleteContent={handleUnschedule}
          onPublishNow={handlePublishNow}
          onScheduleContent={handleScheduleContent}
          loading={loading}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          onClose={() => {
            setShowScheduleModal(false);
            setPreselectedDate(null);
          }}
          onSchedule={handleSchedule}
          preselectedDate={preselectedDate}
          error={actionError}
        />
      )}

      {/* Edit Schedule Modal */}
      {selectedContent && (
        <EditScheduleModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          onUpdate={fetchScheduledContent}
        />
      )}

      {/* W26: recurring rules, visible and manageable */}
      <RecurringRulesPanel
        refreshKey={rulesRefresh}
        onEdit={(rule) => { setEditingRule(rule); setShowRecurringModal(true); }}
      />

      {/* Recurring Content Modal */}
      <RecurringContentModal
        isOpen={showRecurringModal}
        onClose={() => { setShowRecurringModal(false); setEditingRule(null); }}
        onSave={handleSaveRecurringRule}
        editingRule={editingRule}
      />
    </div>
  );
};

// Schedule Modal Component
const ScheduleModal: React.FC<{
  onClose: () => void;
  onSchedule: (contentId: string, scheduledDate: string) => void;
  preselectedDate?: Date | null;
  error?: string;
}> = ({ onClose, onSchedule, preselectedDate, error }) => {
  const [availableContent, setAvailableContent] = useState<any[]>([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  useEffect(() => {
    fetchAvailableContent();
    
    // Pre-fill date if provided from calendar
    if (preselectedDate) {
      const local = toDateTimeLocalValue(preselectedDate);
      if (local) {
        setScheduledDate(local.slice(0, 10));
        setScheduledTime(local.slice(11, 16));
      }
    }
  }, [preselectedDate]);

  const fetchAvailableContent = async () => {
    try {
      const response = await fetch('/api/admin/unscheduled-content');
      if (response.ok) {
        const data = await response.json();
        setAvailableContent(data);
      }
    } catch (error) {
      console.error('Failed to fetch available content:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContentId && scheduledDate && scheduledTime) {
      const utc = fromDateTimeLocalValue(`${scheduledDate}T${scheduledTime}`);
      if (utc) onSchedule(selectedContentId, utc);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Schedule Content
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Content
            </label>
            <select
              value={selectedContentId}
              onChange={(e) => setSelectedContentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Choose content to schedule...</option>
              {availableContent.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Schedule Modal Component
const EditScheduleModal: React.FC<{
  content: ScheduledPost;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ content, onClose, onUpdate }) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const local = toDateTimeLocalValue(content.scheduledDate);
    setScheduledDate(local.slice(0, 10));
    setScheduledTime(local.slice(11, 16));
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const utc = fromDateTimeLocalValue(`${scheduledDate}T${scheduledTime}`);
      if (!utc) { setError('Enter a valid date and time'); return; }
      const response = await fetch(`/api/admin/scheduled-content/${content.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: utc })
      });

      if (!response.ok) { setError(await failureText(response, 'Not rescheduled')); return; }
      onUpdate();
      onClose();
    } catch (err) {
      setError(`Not rescheduled: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Edit Schedule: {content.title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentScheduler; 