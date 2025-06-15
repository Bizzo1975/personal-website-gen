'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClockIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';

interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  author: string;
  createdAt: string;
  changeType: 'created' | 'updated' | 'published' | 'unpublished';
  changeDescription?: string;
  isCurrent: boolean;
}

interface ContentVersioningProps {
  contentId: string;
  contentType: 'post' | 'project' | 'page';
  onVersionRestore?: (version: ContentVersion) => void;
}

const ContentVersioning: React.FC<ContentVersioningProps> = ({
  contentId,
  contentType,
  onVersionRestore
}) => {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [compareVersion, setCompareVersion] = useState<ContentVersion | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [contentId]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/admin/content-versions/${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (version: ContentVersion) => {
    try {
      const response = await fetch(`/api/admin/restore-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          versionId: version.id,
          contentType
        })
      });

      if (response.ok) {
        await fetchVersions();
        onVersionRestore?.(version);
        setNotification({
          type: 'success',
          message: `Successfully restored to version ${version.version}`
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        throw new Error('Failed to restore version');
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
      setNotification({
        type: 'error',
        message: 'Failed to restore version. Please try again.'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'updated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'published':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'unpublished':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateWordDiff = (oldText: string, newText: string) => {
    const oldWords = oldText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    
    const added = newWords.length - oldWords.length;
    const changed = Math.abs(added);
    
    return { added, changed };
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
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Version History
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Version List */}
      <div className="space-y-3">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No version history available</p>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
                version.isCurrent 
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Version {version.version}
                      </span>
                      {version.isCurrent && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                          Current
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChangeTypeColor(version.changeType)}`}>
                        {version.changeType}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {version.author}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(version.createdAt)}
                    </div>
                  </div>

                  {version.changeDescription && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {version.changeDescription}
                    </p>
                  )}

                  {/* Content Changes Summary */}
                  {index > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {(() => {
                        const prevVersion = versions[index - 1];
                        const diff = calculateWordDiff(prevVersion.content, version.content);
                        return diff.changed > 0 
                          ? `${diff.added > 0 ? '+' : ''}${diff.added} words changed`
                          : 'No content changes';
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedVersion(version);
                      setShowPreview(true);
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>

                  {index > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedVersion(version);
                        setCompareVersion(versions[index - 1]);
                        setShowDiff(true);
                      }}
                    >
                      <CodeBracketIcon className="h-4 w-4" />
                    </Button>
                  )}

                  {!version.isCurrent && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestoreVersion(version)}
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preview Version {selectedVersion.version}
                </h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedVersion.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(selectedVersion.createdAt)} by {selectedVersion.author}
                  </p>
                </div>

                {selectedVersion.excerpt && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Excerpt
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400 italic">
                      {selectedVersion.excerpt}
                    </p>
                  </div>
                )}

                {selectedVersion.tags && selectedVersion.tags.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedVersion.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </h5>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {showDiff && selectedVersion && compareVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Compare Versions {compareVersion.version} → {selectedVersion.version}
                </h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowDiff(false)}
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Version {compareVersion.version} (Previous)
                  </h4>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                      {compareVersion.content}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Version {selectedVersion.version} (Current)
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentVersioning; 