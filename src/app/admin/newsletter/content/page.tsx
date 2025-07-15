'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';

interface NewsletterContent {
  title: string;
  description: string;
  incentive: string;
}

export default function NewsletterContentPage() {
  const [content, setContent] = useState<NewsletterContent>({
    title: '',
    description: '',
    incentive: ''
  });
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchContent();
    fetchSubscriberCount();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/newsletter-content');
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Error fetching newsletter content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriberCount = async () => {
    try {
      const response = await fetch('/api/newsletter/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setSubscriberCount(data.totalSubscribers || 0);
      }
    } catch (error) {
      console.error('Error fetching subscriber count:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/newsletter-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving newsletter content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="Newsletter Content">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Newsletter Content">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Newsletter Content Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage the newsletter signup content that appears throughout your website
          </p>
        </div>

        {/* Subscriber Count Display */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Current Subscriber Count
          </h3>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {subscriberCount.toLocaleString()} subscribers
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
            This count is automatically updated from your database
          </p>
        </div>

        <Card variant="default">
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Newsletter Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={content.title}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Stay in the Loop"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={content.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe what subscribers will get..."
                  required
                />
              </div>

              <div>
                <label htmlFor="incentive" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Incentive Text
                </label>
                <input
                  type="text"
                  id="incentive"
                  name="incentive"
                  value={content.incentive}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 🚀 Plus exclusive tips and early access"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  {saved && (
                    <span className="text-green-600 dark:text-green-400 text-sm">
                      ✓ Content saved successfully
                    </span>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? 'Saving...' : 'Save Content'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Preview
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{content.title}</strong>
            <p className="mt-1">{content.description}</p>
            {content.incentive && (
              <p className="mt-1 italic">{content.incentive}</p>
            )}
            <p className="mt-2 text-xs">Subscribers: {subscriberCount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 