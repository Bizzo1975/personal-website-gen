'use client';

import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/Button';

interface RecurringContentRule {
  id?: string;
  name: string;
  contentType: 'post' | 'project' | 'newsletter';
  templateContentId?: string;
  recurrencePattern: 'weekly' | 'monthly';
  recurrenceDay: number;
  recurrenceTime: string;
  targetAccessLevels: string[];
  isActive: boolean;
}

interface RecurringContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: RecurringContentRule) => void;
  editingRule?: RecurringContentRule | null;
}

const RecurringContentModal: React.FC<RecurringContentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRule
}) => {
  const [rule, setRule] = useState<RecurringContentRule>({
    name: '',
    contentType: 'post',
    recurrencePattern: 'weekly',
    recurrenceDay: 1,
    recurrenceTime: '09:00',
    targetAccessLevels: ['all'],
    isActive: true
  });

  const [availableContent, setAvailableContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setRule(editingRule);
    } else {
      setRule({
        name: '',
        contentType: 'post',
        recurrencePattern: 'weekly',
        recurrenceDay: 1,
        recurrenceTime: '09:00',
        targetAccessLevels: ['all'],
        isActive: true
      });
    }
  }, [editingRule]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableContent();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(rule);
      onClose();
    } catch (error) {
      console.error('Failed to save recurring content rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RecurringContentRule, value: any) => {
    setRule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getWeekdayName = (day: number) => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[day];
  };

  const getMonthDayName = (day: number) => {
    const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    return `${day}${suffix}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5" />
            {editingRule ? 'Edit Recurring Content' : 'Create Recurring Content'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rule Name
            </label>
            <input
              type="text"
              value={rule.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Weekly Newsletter"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Type
            </label>
            <select
              value={rule.contentType}
              onChange={(e) => handleInputChange('contentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="post">Post</option>
              <option value="project">Project</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Content (Optional)
            </label>
            <select
              value={rule.templateContentId || ''}
              onChange={(e) => handleInputChange('templateContentId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">No template</option>
              {availableContent
                .filter(content => content.type === rule.contentType)
                .map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recurrence Pattern
            </label>
            <select
              value={rule.recurrencePattern}
              onChange={(e) => handleInputChange('recurrencePattern', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {rule.recurrencePattern === 'weekly' ? 'Day of Week' : 'Day of Month'}
            </label>
            <select
              value={rule.recurrenceDay}
              onChange={(e) => handleInputChange('recurrenceDay', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {rule.recurrencePattern === 'weekly' ? (
                [...Array(7)].map((_, i) => (
                  <option key={i} value={i}>
                    {getWeekdayName(i)}
                  </option>
                ))
              ) : (
                [...Array(31)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthDayName(i + 1)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <input
              type="time"
              value={rule.recurrenceTime}
              onChange={(e) => handleInputChange('recurrenceTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Access Levels
            </label>
            <div className="space-y-2">
              {['all', 'professional', 'personal'].map((level) => (
                <label key={level} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rule.targetAccessLevels.includes(level)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('targetAccessLevels', [...rule.targetAccessLevels, level]);
                      } else {
                        handleInputChange('targetAccessLevels', rule.targetAccessLevels.filter(l => l !== level));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {level}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={rule.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
              Active
            </span>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringContentModal; 