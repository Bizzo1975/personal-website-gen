'use client'
import '@/styles/globals.css';
;

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: '/' });
  };

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      setIsLoading(false);
      return;
    }

    // Here we would normally send a request to update the password
    // For now, we'll just simulate a successful update
    setTimeout(() => {
      setMessage('Password updated successfully');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsLoading(false);
    }, 1000);
  };

  const settings = [
    {
      title: 'Profile Information',
      description: 'Edit your profile details, photo, skills, and social media links',
      route: '/admin/settings/profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: 'Website Settings',
      description: 'Configure site-wide settings, metadata, and SEO options',
      route: '/admin/settings/website',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your account settings</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card variant="default">
          <CardHeader>
            <h2 className="text-lg font-medium">Account Information</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-lg">{session?.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-lg">{session?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                <p className="text-lg capitalize">{session?.user?.role || 'User'}</p>
              </div>
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="default">
          <CardHeader>
            <h2 className="text-lg font-medium">Change Password</h2>
          </CardHeader>
          <CardBody>
            {message && (
              <div className={`p-3 mb-4 rounded-md ${
                message.includes('successfully') 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}>
                {message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting, index) => (
          <Card 
            key={index} 
            variant="default" 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(setting.route)}
          >
            <div className="flex items-start space-x-4">
              <div className="rounded-full bg-primary-100 dark:bg-primary-900 p-3 text-primary-700 dark:text-primary-300">
                {setting.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{setting.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{setting.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 