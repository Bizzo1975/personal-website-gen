'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Newsletter } from '@/types/newsletter';

interface CampaignFormData {
  name: string;
  description: string;
  newsletterId: string;
  scheduledAt?: Date;
  sendImmediately: boolean;
  targetAudience: {
    segments: string[];
    permissions: string[];
    tags: string[];
    excludeTags: string[];
  };
  settings: {
    timezone: string;
    throttleRate: number;
    trackOpens: boolean;
    trackClicks: boolean;
  };
}

const CreateCampaignPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newsletterId = searchParams.get('newsletterId');

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    newsletterId: newsletterId || '',
    sendImmediately: false,
    targetAudience: {
      segments: ['all_subscribers'],
      permissions: ['all'],
      tags: [],
      excludeTags: []
    },
    settings: {
      timezone: 'UTC',
      throttleRate: 100,
      trackOpens: true,
      trackClicks: true
    }
  });

  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockNewsletters: Newsletter[] = [
        {
          id: '1',
          title: 'Weekly Web Dev Digest #47',
          slug: 'weekly-digest-47',
          subject: 'Advanced React Patterns & Next.js 14 Updates',
          previewText: 'This week: React patterns, Next.js updates, and performance tips',
          content: '',
          htmlContent: '',
          plainTextContent: '',
          status: 'draft',
          type: 'blog_digest',
          permissions: {
            level: 'all',
            allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
            allowedUsers: [],
            restrictedUsers: [],
            requiresAuth: false,
            customRules: []
          },
          template: 'digest',
          author: 'admin',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        }
      ];

      setNewsletters(mockNewsletters);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNestedInputChange = (
    parent: keyof CampaignFormData,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent] as any,
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.newsletterId) {
      newErrors.newsletterId = 'Please select a newsletter';
    }

    if (!formData.sendImmediately && !formData.scheduledAt) {
      newErrors.scheduledAt = 'Please set a schedule time or select send immediately';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      // Mock API call - replace with actual implementation
      console.log('Creating campaign:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      router.push('/admin/newsletter/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: 'Failed to create campaign. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedNewsletter = newsletters.find(n => n.id === formData.newsletterId);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Create Campaign
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Campaign creation form will be here.
        </p>
        <Link
          href="/admin/newsletter/campaigns"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Campaigns
        </Link>
      </div>
    </div>
  );
};

export default CreateCampaignPage; 