'use client';

import React from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import MediaLibrary from '@/components/admin/MediaLibrary';

export default function MediaLibraryPage() {
  return (
    <AdminLayout title="Media Library">
      <AdminPageLayout
        title="Media Library"
        description="Upload and manage your media files with advanced features"
      >
        <MediaLibrary />
      </AdminPageLayout>
    </AdminLayout>
  );
} 