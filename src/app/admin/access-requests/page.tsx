'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import Button from '@/components/Button';
import Card, { CardBody, CardHeader } from '@/components/Card';
import { AccessRequest } from '@/lib/models/access-request';
import { BiCheck, BiX, BiUser, BiEnvelope, BiTime, BiMessageSquareDetail, BiDownload, BiTrash } from 'react-icons/bi';

interface StatusMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  dismissible?: boolean;
}

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  recentRequests: AccessRequest[];
}

export default function AdminAccessRequestsPage() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch access requests
  const fetchAccessRequests = async () => {
    try {
      const url = selectedStatus === 'all' 
        ? '/api/access-requests'
        : `/api/access-requests?status=${selectedStatus}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setAccessRequests(data.accessRequests || []);
        setStats(data.stats || null);
      } else {
        throw new Error(data.error || 'Failed to fetch access requests');
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to load access requests'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessRequests();
  }, [selectedStatus]);

  // Handle status update (approve/reject)
  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/access-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminNotes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage({
          type: 'success',
          message: `Access request ${status} successfully${data.userCreated ? ' and user account created' : ''}`
        });
        
        // Refresh the list
        await fetchAccessRequests();
      } else {
        throw new Error(data.error || `Failed to ${status} access request`);
      }
    } catch (error) {
      console.error(`Error ${status} access request:`, error);
      setStatusMessage({
        type: 'error',
        message: `Failed to ${status} access request`
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (action: 'approve' | 'reject', adminNotes?: string) => {
    if (selectedRequests.length === 0) return;

    setBulkProcessing(true);
    try {
      const response = await fetch('/api/access-requests/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestIds: selectedRequests,
          action,
          adminNotes,
          createUserAccounts: true
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage({
          type: 'success',
          message: `Bulk ${action} completed: ${data.successCount} successful, ${data.failureCount} failed`
        });
        
        // Clear selection and refresh
        setSelectedRequests([]);
        setShowBulkActions(false);
        await fetchAccessRequests();
      } else {
        throw new Error(data.error || `Failed to ${action} requests`);
      }
    } catch (error) {
      console.error(`Error bulk ${action}:`, error);
      setStatusMessage({
        type: 'error',
        message: `Failed to ${action} selected requests`
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    const pendingRequests = accessRequests.filter(req => req.status === 'pending');
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingRequests.map(req => req._id!));
    }
  };

  // Handle individual selection
  const handleSelectRequest = (id: string) => {
    setSelectedRequests(prev => 
      prev.includes(id) 
        ? prev.filter(reqId => reqId !== id)
        : [...prev, id]
    );
  };

  // Clear status message after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Show bulk actions when requests are selected
  useEffect(() => {
    setShowBulkActions(selectedRequests.length > 0);
  }, [selectedRequests]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200`;
    }
  };

  const getAccessLevelBadge = (level: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (level) {
      case 'personal':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200`;
      case 'professional':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200`;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = accessRequests.filter(req => req.status === 'pending').length;
  const pendingRequests = accessRequests.filter(req => req.status === 'pending');

  if (loading) {
    return (
      <AdminLayout title="Access Requests">
        <div className="text-center py-10">Loading access requests...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Access Requests">
      <AdminPageLayout
        title="Access Requests Management"
        description={`Manage user access requests and control platform access`}
        status={statusMessage || undefined}
      >
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Total Requests</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Pending</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Approved</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Rejected</div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedRequests.length} request{selectedRequests.length > 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequests([])}
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkOperation('approve', 'Bulk approved by admin')}
                    disabled={bulkProcessing}
                    className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                  >
                    <BiCheck className="w-4 h-4 mr-1" />
                    {bulkProcessing ? 'Processing...' : 'Approve All'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkOperation('reject', 'Bulk rejected by admin')}
                    disabled={bulkProcessing}
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                  >
                    <BiX className="w-4 h-4 mr-1" />
                    {bulkProcessing ? 'Processing...' : 'Reject All'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({accessRequests.length})
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Pending {pendingCount > 0 && <span className="ml-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
            <button
              onClick={() => setSelectedStatus('approved')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === 'approved'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setSelectedStatus('rejected')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === 'rejected'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Rejected
            </button>
          </div>
          
          {/* Additional Actions */}
          <div className="flex items-center space-x-2">
            {pendingRequests.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-slate-600 dark:text-slate-400"
              >
                {selectedRequests.length === pendingRequests.length ? 'Deselect All' : 'Select All Pending'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/access-requests/export', '_blank')}
              className="text-slate-600 dark:text-slate-400"
            >
              <BiDownload className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Access Requests List */}
        {accessRequests.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <BiUser className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No access requests
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {selectedStatus === 'all' 
                    ? 'No access requests have been submitted yet.'
                    : `No ${selectedStatus} access requests found.`
                  }
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {accessRequests.map((request) => (
              <Card key={request._id} variant="default">
                <CardBody>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Selection Checkbox */}
                        {request.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(request._id!)}
                            onChange={() => handleSelectRequest(request._id!)}
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        )}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <BiUser className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {request.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                            <BiEnvelope className="w-4 h-4" />
                            <span>{request.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={getStatusBadge(request.status)}>
                          {request.status}
                        </span>
                        {request.accessLevel && (
                          <span className={getAccessLevelBadge(request.accessLevel)}>
                            {request.accessLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                          Subject
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {request.subject}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1 flex items-center">
                          <BiMessageSquareDetail className="w-4 h-4 mr-1" />
                          Message
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                          {request.message}
                        </p>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center">
                        <BiTime className="w-4 h-4 mr-1" />
                        Submitted: {formatDate(request.submittedAt)}
                      </div>
                      {request.processedAt && (
                        <div>
                          Processed: {formatDate(request.processedAt)} by {request.processedBy}
                        </div>
                      )}
                    </div>

                    {/* Admin Notes */}
                    {request.adminNotes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                          Admin Notes
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          {request.adminNotes}
                        </p>
                      </div>
                    )}

                    {/* Actions for pending requests */}
                    {request.status === 'pending' && (
                      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(request._id!, 'rejected', 'Access request rejected by admin')}
                          disabled={processingId === request._id}
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                        >
                          <BiX className="w-4 h-4 mr-1" />
                          {processingId === request._id ? 'Rejecting...' : 'Reject'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(request._id!, 'approved', 'Access request approved by admin')}
                          disabled={processingId === request._id}
                          className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                        >
                          <BiCheck className="w-4 h-4 mr-1" />
                          {processingId === request._id ? 'Approving...' : 'Approve'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
} 