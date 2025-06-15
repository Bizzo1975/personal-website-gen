'use client';

import React from 'react';
import Link from 'next/link';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';

const CampaignsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Newsletter Campaigns
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Schedule and manage your newsletter distribution campaigns
          </p>
        </div>
        <Link
          href="/admin/newsletter/campaigns/create"
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Campaign
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Campaign Management</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create and schedule newsletter campaigns to reach your audience
          </p>
          <Link
            href="/admin/newsletter/campaigns/create"
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Your First Campaign
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage; 