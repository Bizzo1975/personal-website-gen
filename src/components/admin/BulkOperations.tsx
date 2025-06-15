'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  TagIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  type: 'post' | 'project' | 'page';
  status: 'published' | 'draft' | 'scheduled';
  publishedAt?: string;
  tags?: string[];
  author: string;
}

interface BulkOperation {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: string;
  requiresConfirmation: boolean;
  description: string;
}

const BulkOperations: React.FC = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'post' | 'project' | 'page'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');

  const bulkOperations: BulkOperation[] = [
    {
      id: 'publish',
      label: 'Publish',
      icon: EyeIcon,
      action: 'publish',
      requiresConfirmation: true,
      description: 'Make selected items publicly visible'
    },
    {
      id: 'unpublish',
      label: 'Unpublish',
      icon: EyeSlashIcon,
      action: 'unpublish',
      requiresConfirmation: true,
      description: 'Hide selected items from public view'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      action: 'delete',
      requiresConfirmation: true,
      description: 'Permanently delete selected items'
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: DocumentDuplicateIcon,
      action: 'duplicate',
      requiresConfirmation: false,
      description: 'Create copies of selected items'
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: CalendarIcon,
      action: 'schedule',
      requiresConfirmation: false,
      description: 'Schedule selected items for future publication'
    },
    {
      id: 'export',
      label: 'Export',
      icon: ArrowDownTrayIcon,
      action: 'export',
      requiresConfirmation: false,
      description: 'Export selected items as JSON'
    },
    {
      id: 'addTags',
      label: 'Add Tags',
      icon: TagIcon,
      action: 'addTags',
      requiresConfirmation: false,
      description: 'Add tags to selected items'
    }
  ];

  useEffect(() => {
    fetchContentItems();
  }, []);

  const fetchContentItems = async () => {
    try {
      const response = await fetch('/api/admin/content-items');
      if (response.ok) {
        const data = await response.json();
        setContentItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch content items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredIds = getFilteredItems().map(item => item.id);
      setSelectedItems(new Set(filteredIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const getFilteredItems = () => {
    return contentItems.filter(item => {
      const typeMatch = filterType === 'all' || item.type === filterType;
      const statusMatch = filterStatus === 'all' || item.status === filterStatus;
      return typeMatch && statusMatch;
    });
  };

  const handleBulkOperation = async (operation: BulkOperation) => {
    if (selectedItems.size === 0) return;

    setSelectedOperation(operation);
    
    if (operation.requiresConfirmation) {
      setShowConfirmModal(true);
    } else {
      await executeBulkOperation(operation);
    }
  };

  const executeBulkOperation = async (operation: BulkOperation) => {
    setOperationInProgress(true);
    setShowConfirmModal(false);

    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: operation.action,
          itemIds: Array.from(selectedItems)
        })
      });

      if (response.ok) {
        await fetchContentItems();
        setSelectedItems(new Set());
        
        if (operation.action === 'export') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `content-export-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setOperationInProgress(false);
    }
  };

  const filteredItems = getFilteredItems();
  const allSelected = filteredItems.length > 0 && filteredItems.every(item => selectedItems.has(item.id));
  const someSelected = filteredItems.some(item => selectedItems.has(item.id));

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Operations</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedItems.size} of {filteredItems.length} items selected
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Types</option>
          <option value="post">Posts</option>
          <option value="project">Projects</option>
          <option value="page">Pages</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {bulkOperations.map((operation) => (
                <Button
                  key={operation.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation(operation)}
                  disabled={operationInProgress}
                >
                  <operation.icon className="h-4 w-4 mr-1" />
                  {operation.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={handleSelectAll}
              label="Select all"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Content Items
            </span>
          </div>
        </div>

        {/* Content Items */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No content items found</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onChange={(checked) => handleSelectItem(item.id, checked)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {item.type}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : item.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>/{item.slug}</span>
                      <span>by {item.author}</span>
                      {item.publishedAt && (
                        <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-2 flex items-center space-x-1">
                        <TagIcon className="h-3 w-3 text-gray-400" />
                        <div className="flex space-x-1">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{item.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <selectedOperation.icon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm {selectedOperation.label}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to {selectedOperation.action} {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}? 
              {selectedOperation.action === 'delete' && ' This action cannot be undone.'}
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={operationInProgress}
              >
                Cancel
              </Button>
              <Button
                variant={selectedOperation.action === 'delete' ? 'danger' : 'primary'}
                onClick={() => executeBulkOperation(selectedOperation)}
                disabled={operationInProgress}
              >
                {operationInProgress ? 'Processing...' : `Confirm ${selectedOperation.label}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperations; 