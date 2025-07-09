'use client';

import React, { useState } from 'react';
import { BiCheck, BiX, BiTime, BiUser, BiEnvelope, BiMessageSquareDetail, BiSearch } from 'react-icons/bi';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import HeaderSection from '@/components/HeaderSection';

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  accessLevel: 'professional' | 'personal';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  processedAt?: string;
  adminNotes?: string;
}

interface CurrentAccess {
  hasProfessionalAccess: boolean;
  hasPersonalAccess: boolean;
  isActive: boolean;
  grantedAt: string;
}

interface StatusResponse {
  email: string;
  requests: AccessRequest[];
  currentAccess: CurrentAccess | null;
  summary: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    hasAnyAccess: boolean;
  };
}

export default function RequestStatusPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusData(null);

    try {
      const response = await fetch(`/api/access-requests/status?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      setStatusData(data);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full";
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
    const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full";
    switch (level) {
      case 'personal':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200`;
      case 'professional':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200`;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeaderSection
        title="Access Request Status"
        subtitle="Check the status of your access requests and current permissions"
        className="mb-12"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BiSearch className="w-5 h-5 mr-2" />
              Check Your Status
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your email address to view your access request history and current permissions
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Checking...' : 'Check Status'}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8">
            <CardBody>
              <div className="flex items-center text-red-600 dark:text-red-400">
                <BiX className="w-5 h-5 mr-2" />
                {error}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Status Results */}
        {hasSearched && statusData && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardBody>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {statusData.summary.totalRequests}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Requests</div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {statusData.summary.pendingRequests}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {statusData.summary.approvedRequests}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Current Access Status */}
            {statusData.currentAccess && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <BiCheck className="w-5 h-5 mr-2 text-green-500" />
                    Current Access
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Professional Access:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusData.currentAccess.hasProfessionalAccess
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                      }`}>
                        {statusData.currentAccess.hasProfessionalAccess ? 'Granted' : 'Not Granted'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Personal Access:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusData.currentAccess.hasPersonalAccess
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                      }`}>
                        {statusData.currentAccess.hasPersonalAccess ? 'Granted' : 'Not Granted'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Account Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusData.currentAccess.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                      }`}>
                        {statusData.currentAccess.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {statusData.currentAccess.grantedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Granted:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(statusData.currentAccess.grantedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Request History */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <BiTime className="w-5 h-5 mr-2" />
                  Request History
                </h3>
              </CardHeader>
              <CardBody>
                {statusData.requests.length === 0 ? (
                  <div className="text-center py-8">
                    <BiUser className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No access requests found for this email address.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statusData.requests.map((request) => (
                      <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <BiUser className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {request.subject}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Submitted: {formatDate(request.submittedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={getStatusBadge(request.status)}>
                              {request.status}
                            </span>
                            <span className={getAccessLevelBadge(request.accessLevel)}>
                              {request.accessLevel}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {request.message}
                          </p>
                        </div>

                        {request.processedAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Processed: {formatDate(request.processedAt)}
                          </div>
                        )}

                        {request.adminNotes && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                              Admin Notes:
                            </h5>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              {request.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* No Results Message */}
        {hasSearched && statusData && statusData.requests.length === 0 && !statusData.currentAccess && (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <BiEnvelope className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Records Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  We couldn't find any access requests or current permissions for this email address.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  If you believe this is an error, please contact support.
                </p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
} 