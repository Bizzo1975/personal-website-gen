'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import Card, { CardHeader, CardBody } from '@/components/Card';
import Button from '@/components/Button';
import { 
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface MigrationItem {
  category: string;
  originalPath: string;
  description: string;
  migrated: boolean;
  mediaFileId?: string;
  error?: string;
}

export default function MediaMigrationPage() {
  const [migrationItems, setMigrationItems] = useState<MigrationItem[]>([
    {
      category: 'logo',
      originalPath: '/images/jlk-logo.png',
      description: 'Website Logo (PNG)',
      migrated: false
    },
    {
      category: 'logo',
      originalPath: '/images/jlk-logo.svg',
      description: 'Website Logo (SVG)',
      migrated: false
    },
    {
      category: 'slideshow',
      originalPath: '/images/slideshow/coding-1.jpg',
      description: 'Background slideshow - coding workspace',
      migrated: false
    },
    {
      category: 'slideshow',
      originalPath: '/images/slideshow/coding-2.jpg',
      description: 'Background slideshow - developer environment',
      migrated: false
    },
    {
      category: 'slideshow',
      originalPath: '/images/slideshow/coding-3.jpg',
      description: 'Background slideshow - programming setup',
      migrated: false
    },
    {
      category: 'slideshow',
      originalPath: '/images/slideshow/coding-4.jpg',
      description: 'Background slideshow - tech workspace',
      migrated: false
    },
    {
      category: 'slideshow',
      originalPath: '/images/slideshow/coding-5.jpg',
      description: 'Background slideshow - development tools',
      migrated: false
    },
    {
      category: 'profile',
      originalPath: '/images/profiles/9197d18e-f756-4777-8122-62a73db8ff89.jpg',
      description: 'Profile photo 1',
      migrated: false
    },
    {
      category: 'profile',
      originalPath: '/images/profiles/7245626d-1e82-4e58-807c-d02b0720260a.jpg',
      description: 'Profile photo 2',
      migrated: false
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check migration status on component mount
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/api/admin/media-migration/status');
      if (response.ok) {
        const data = await response.json();
        if (data.migrated && data.items) {
          setMigrationItems(data.items);
          setCompleted(data.completed);
        }
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const runMigration = async () => {
    setIsRunning(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Starting migration...');

    try {
      const response = await fetch('/api/admin/media-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: migrationItems })
      });

      if (!response.ok) {
        throw new Error('Migration failed');
      }

      // Stream the response for real-time updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'progress') {
                setProgress(data.progress);
                setCurrentStep(data.message);
              } else if (data.type === 'item_update') {
                setMigrationItems(prev => 
                  prev.map(item => 
                    item.originalPath === data.originalPath 
                      ? { ...item, migrated: data.migrated, mediaFileId: data.mediaFileId, error: data.error }
                      : item
                  )
                );
              } else if (data.type === 'complete') {
                setCompleted(true);
                setCurrentStep('Migration completed successfully!');
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

    } catch (error: any) {
      setError(error.message || 'Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  const migratedCount = migrationItems.filter(item => item.migrated).length;
  const totalCount = migrationItems.length;
  const allMigrated = migratedCount === totalCount;

  return (
    <AdminLayout title="Media Migration">
      <AdminPageLayout
        title="Media Library Migration"
        description="Migrate existing images (logo, profile photos, slideshow) to the media library for better organization"
      >
        <div className="space-y-6">
          {/* Migration Status Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Migration Status</h3>
                <div className="flex items-center gap-2">
                  {allMigrated ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">Complete</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600 dark:text-amber-400">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{migratedCount} of {totalCount} items</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(migratedCount / totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {isRunning && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    <span className="text-sm">{currentStep}</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1 mt-2">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {!allMigrated && !isRunning && (
                <Button
                  onClick={runMigration}
                  variant="primary"
                  icon={<ArrowUpTrayIcon className="h-5 w-5" />}
                  disabled={isRunning}
                >
                  Start Migration
                </Button>
              )}

              {allMigrated && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">All images have been migrated to the media library!</span>
                    </div>
                    <Button
                      href="/admin/media-library"
                      variant="secondary"
                      size="sm"
                    >
                      View Media Library
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Migration Items List */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Items to Migrate</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {migrationItems.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      item.migrated 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : item.error
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        {item.migrated ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : item.error ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <PhotoIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.originalPath}
                        </div>
                        {item.error && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Error: {item.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {item.category}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Benefits of Migration</h3>
            </CardHeader>
            <CardBody>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Cog6ToothIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Centralized Management</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      All images stored in one place with proper metadata and organization
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <PhotoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Better Organization</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Images categorized by type with search and filtering capabilities
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ArrowUpTrayIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Easy Updates</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Change logos, profile photos, and slideshow images through the admin interface
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Version Control</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Track when images were uploaded and by whom
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
} 