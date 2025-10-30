import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

interface NewsletterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewsletterDetailPage({ params }: NewsletterDetailPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link
            href="/admin/newsletter/newsletters"
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Newsletter Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Viewing newsletter ID: {id}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/newsletter/newsletters/${id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Newsletter Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Title</label>
                <p className="text-gray-900 dark:text-white">Sample Newsletter Title</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Published
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Subject</label>
                <p className="text-gray-900 dark:text-white">Sample Email Subject</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                <p className="text-gray-900 dark:text-white">Regular</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Content Preview</h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                Newsletter content preview will be displayed here...
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Sent</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">2,683</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Opens</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">1,605</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Clicks</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">483</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Open Rate</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">59.8%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 