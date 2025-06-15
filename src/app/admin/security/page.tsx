'use client';

import React, { useState } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import {
  ShieldCheckIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  LockClosedIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

function SecurityPageContent() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'2fa' | 'sessions' | 'activity' | 'settings'>('2fa');

  const securityLogs = [
    {
      id: '1',
      action: 'Login successful',
      timestamp: '2024-01-15 14:30:00',
      ip: '192.168.1.100',
      userAgent: 'Chrome 120.0 (Windows)',
      status: 'success'
    },
    {
      id: '2',
      action: 'Failed login attempt',
      timestamp: '2024-01-15 14:25:00',
      ip: '192.168.1.100',
      userAgent: 'Chrome 120.0 (Windows)',
      status: 'warning'
    },
    {
      id: '3',
      action: 'Password changed',
      timestamp: '2024-01-14 09:15:00',
      ip: '192.168.1.100',
      userAgent: 'Chrome 120.0 (Windows)',
      status: 'success'
    }
  ];

  const activeSessions = [
    {
      id: '1',
      device: 'Windows Chrome',
      location: 'New York, US',
      lastActive: '2024-01-15 14:30:00',
      current: true
    },
    {
      id: '2',
      device: 'iPhone Safari',
      location: 'New York, US',
      lastActive: '2024-01-15 10:15:00',
      current: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  return (
    <AdminPageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Security & Two-Factor Authentication
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage security settings, two-factor authentication, and monitor account activity
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Advanced Security Features
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            This section includes comprehensive security management including two-factor authentication, session management, and security monitoring.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Two-Factor Auth</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">Setup authenticator apps and backup codes</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Session Management</h4>
              <p className="text-sm text-green-700 dark:text-green-300">Monitor and control active login sessions</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Activity Monitoring</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">Track login attempts and security events</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Password Security</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">Manage password policies and requirements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { key: '2fa', label: 'Two-Factor Auth', icon: <ShieldCheckIcon className="h-4 w-4" /> },
            { key: 'sessions', label: 'Active Sessions', icon: <DevicePhoneMobileIcon className="h-4 w-4" /> },
            { key: 'activity', label: 'Security Log', icon: <EyeIcon className="h-4 w-4" /> },
            { key: 'settings', label: 'Settings', icon: <LockClosedIcon className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Two-Factor Authentication Tab */}
      {activeTab === '2fa' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {!twoFactorEnabled ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Two-Factor Authentication is not enabled
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Your account is less secure without 2FA. Enable it now to protect your account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          Authenticator App
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Use an authenticator app like Google Authenticator or Authy to generate codes.
                      </p>
                      <Button
                        onClick={() => setTwoFactorEnabled(true)}
                        variant="primary"
                        size="sm"
                      >
                        Setup Authenticator
                      </Button>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50">
                      <div className="flex items-center space-x-3 mb-3">
                        <KeyIcon className="h-6 w-6 text-gray-400" />
                        <h4 className="font-medium text-gray-500 dark:text-gray-400">
                          SMS Verification
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Receive verification codes via SMS (Coming Soon).
                      </p>
                      <Button variant="outline" size="sm" disabled>
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                          Two-Factor Authentication is enabled
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Your account is protected with 2FA using an authenticator app.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DevicePhoneMobileIcon className="h-6 w-6 text-green-600" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          Authenticator App
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Active since January 10, 2024
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button variant="outline" size="sm">
                        View Backup Codes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTwoFactorEnabled(false)}
                      >
                        Disable 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Active Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Active Sessions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your active login sessions across different devices
              </p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <DevicePhoneMobileIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {session.device}
                          </h4>
                          {session.current && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {session.location} • Last active {new Date(session.lastActive).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Security Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Security Activity Log
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monitor recent security events and account activity
              </p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className={`flex-shrink-0 ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {log.action}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>IP: {log.ip}</p>
                        <p>Device: {log.userAgent}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Security Settings
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Password Requirements
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure password complexity requirements
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Session Timeout
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically log out after inactivity
                    </p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>8 hours</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Login Notifications
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified of new login attempts
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Failed Login Lockout
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lock account after multiple failed attempts
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Danger Zone
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-200">
                      Reset All Sessions
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Sign out of all devices and sessions
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Reset Sessions
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-200">
                      Download Security Log
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Export complete security activity log
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download Log
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </AdminPageLayout>
  );
}

export default function SecurityPage() {
  return (
    <AdminLayout title="Security & 2FA">
      <SecurityPageContent />
    </AdminLayout>
  );
} 