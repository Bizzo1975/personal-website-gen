'use client';

import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '@/components/AccessibilityEnhancements';

interface NewsletterSignupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'compact' | 'inline' | 'popup' | 'modal' | 'sidebar';
  title?: string;
  description?: string;
  incentive?: string;
  showSocialProof?: boolean;
  subscriberCount?: number;
  placeholder?: string;
  buttonText?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark' | 'accent';
  position?: 'fixed' | 'sticky' | 'static';
  onSubscribe?: (email: string, firstName?: string) => Promise<boolean>;
  onClose?: () => void;
  contentOverride?: {
    title?: string;
    description?: string;
    incentive?: string;
  };
}

interface SubscriptionData {
  email: string;
  firstName?: string;
  interests?: string[];
  source: string;
  timestamp: Date;
}

interface NewsletterContent {
  title: string;
  description: string;
  incentive: string;
  subscriberCount: number;
  footerText: string;
  weeklyArticlesIcon: string;
  weeklyArticlesTitle: string;
  weeklyArticlesDescription: string;
  exclusiveTipsIcon: string;
  exclusiveTipsTitle: string;
  exclusiveTipsDescription: string;
  earlyAccessIcon: string;
  earlyAccessTitle: string;
  earlyAccessDescription: string;
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  variant = 'inline',
  title,
  description,
  incentive,
  showSocialProof = true,
  subscriberCount,
  className = '',
  onSuccess,
  onError,
  contentOverride
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [adminContent, setAdminContent] = useState<NewsletterContent | null>(null);
  const [contentLoading, setContentLoading] = useState(true);

  // Available interest categories
  const interestOptions = [
    'Web Development',
    'React & Next.js',
    'TypeScript',
    'UI/UX Design',
    'Performance Optimization',
    'SEO & Marketing',
    'DevOps & Deployment',
    'Personal Development',
    'Industry News',
    'Tutorial Requests'
  ];

  // Fetch admin content on component mount
  useEffect(() => {
    const fetchAdminContent = async () => {
      try {
        const response = await fetch('/api/admin/newsletter-content');
        if (response.ok) {
          const data = await response.json();
          setAdminContent(data);
        }
      } catch (error) {
        console.error('Error fetching admin newsletter content:', error);
      } finally {
        setContentLoading(false);
      }
    };

    fetchAdminContent();
  }, []);

  // Default content based on variant (fallback if admin content not available)
  const getDefaultContent = () => {
    switch (variant) {
      case 'modal':
        return {
          title: title || 'Stay Updated!',
          description: description || 'Get the latest articles, tutorials, and insights delivered to your inbox.',
          incentive: incentive || '🎁 Plus get our free Ultimate Web Dev Checklist'
        };
      case 'sidebar':
        return {
          title: title || 'Newsletter',
          description: description || 'Weekly insights on web development, design, and technology.',
          incentive: incentive || 'Join 2,800+ developers'
        };
      case 'footer':
        return {
          title: title || 'Subscribe to Newsletter',
          description: description || 'Stay informed with our latest posts and updates.',
          incentive: incentive || 'No spam, unsubscribe at any time'
        };
      case 'popup':
        return {
          title: title || 'Before You Go...',
          description: description || 'Join thousands of developers getting weekly insights!',
          incentive: incentive || '🔥 Exclusive content + Free resources'
        };
      default:
        return {
          title: title || 'Subscribe to the Newsletter',
          description: description || 'Get notified when I publish new articles and tutorials about web development.',
          incentive: incentive || '✨ Plus exclusive tips and early access to new content'
        };
    }
  };

  // Use admin content if available, otherwise fallback to default content
  const content = contentOverride || (adminContent ? {
    title: adminContent.title,
    description: adminContent.description,
    incentive: adminContent.incentive
  } : getDefaultContent());

  const currentSubscriberCount = subscriberCount || (adminContent?.subscriberCount) || 127;

  // Popup logic for exit-intent
  useEffect(() => {
    if (variant === 'popup') {
      let hasShown = false;
      
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 && !hasShown) {
          hasShown = true;
          setShowModal(true);
        }
      };

      document.addEventListener('mouseleave', handleMouseLeave);
      
      // Also show after 30 seconds if not shown
      const timer = setTimeout(() => {
        if (!hasShown) {
          hasShown = true;
          setShowModal(true);
        }
      }, 30000);

      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
        clearTimeout(timer);
      };
    }
  }, [variant]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (showAdvancedOptions && !firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle subscription
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call - in a real app, this would integrate with email service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const subscriptionData: SubscriptionData = {
        email: email.toLowerCase().trim(),
        firstName: firstName.trim() || undefined,
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
        source: variant,
        timestamp: new Date()
      };

      // In a real app, send to your email service (Mailchimp, ConvertKit, etc.)
      console.log('Newsletter subscription:', subscriptionData);
      
      // Simulate different outcomes
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        setIsSubscribed(true);
        onSuccess?.(email);
        
        // Track successful subscription
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'newsletter_signup', {
            event_category: 'engagement',
            event_label: variant,
            value: 1
          });
        }
        
        // Reset form after delay
        setTimeout(() => {
          setEmail('');
          setFirstName('');
          setSelectedInterests([]);
          setShowAdvancedOptions(false);
          if (variant === 'popup' || variant === 'modal') {
            setShowModal(false);
          }
          setIsSubscribed(false);
        }, 5000);
      } else {
        setFormErrors({ submit: 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setFormErrors({ submit: 'Network error. Please check your connection and try again.' });
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const getFormClasses = () => {
    const baseClasses = 'w-full max-w-md mx-auto';
    
    switch (variant) {
      case 'compact':
        return `${baseClasses} text-sm`;
      case 'inline':
        return `${baseClasses} max-w-2xl`;
      case 'sidebar':
        return `${baseClasses} max-w-sm`;
      case 'popup':
      case 'modal':
        return `${baseClasses} max-w-lg`;
      default:
        return baseClasses;
    }
  };

  // Success state
  if (isSubscribed) {
    return (
      <div className={`${getFormClasses()} ${className}`}>
        <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            Welcome aboard! 🎉
          </h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Thanks for subscribing! Check your email for a confirmation message.
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Your first newsletter will arrive within the next week.
          </p>
        </div>
      </div>
    );
  }

  const formContent = (
    <div className={`${getFormClasses()} ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {content.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            {content.description}
          </p>
          {content.incentive && (
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {content.incentive}
            </p>
          )}
        </div>

        {/* Social Proof */}
        {showSocialProof && (
          <div className="flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{currentSubscriberCount.toLocaleString()}+ subscribers</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>No spam, ever</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubscribe} className="space-y-4">
          {/* Advanced Options Toggle */}
          {variant === 'inline' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showAdvancedOptions ? 'Hide' : 'Show'} preferences
              </button>
            </div>
          )}

          {/* First Name (Advanced) */}
          {showAdvancedOptions && (
            <div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name (optional)"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formErrors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.firstName}</p>
              )}
            </div>
          )}

          {/* Email Input */}
          <div>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <AccessibleButton
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={!email.trim()}
                className="px-6 py-3 whitespace-nowrap"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </AccessibleButton>
            </div>
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
            )}
          </div>

          {/* Interests (Advanced) */}
          {showAdvancedOptions && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                What interests you most? (optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {interestOptions.map(interest => (
                  <label
                    key={interest}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInterests.includes(interest)}
                      onChange={() => toggleInterest(interest)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {interest}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submit Error */}
          {formErrors.submit && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {formErrors.submit}
            </p>
          )}

          {/* Privacy Notice */}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {adminContent?.footerText || 'By subscribing, you agree to receive our newsletter and promotional emails. You can unsubscribe at any time.'}{' '}
            <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </a>.
          </p>
        </form>

        {/* Features List - Use admin content if available */}
        {variant === 'inline' && !contentLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                {adminContent?.weeklyArticlesTitle || 'Weekly Articles'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {adminContent?.weeklyArticlesDescription || 'In-depth tutorials and insights'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                {adminContent?.exclusiveTipsTitle || 'Exclusive Tips'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {adminContent?.exclusiveTipsDescription || 'Subscriber-only content and resources'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                {adminContent?.earlyAccessTitle || 'Early Access'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {adminContent?.earlyAccessDescription || 'Be first to see new projects and posts'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Modal/Popup wrapper
  if ((variant === 'popup' || variant === 'modal') && showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="p-8">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return formContent;
};

export default NewsletterSignup; 