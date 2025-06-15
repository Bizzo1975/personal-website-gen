'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  PaperClipIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'project' | 'collaboration' | 'support' | 'access-request';
  accessLevel?: 'author' | 'editor' | 'admin';
  company?: string;
  phone?: string;
  preferredContact: 'email' | 'phone' | 'video-call';
  timeline?: string;
  budget?: string;
  attachments: File[];
  newsletter: boolean;
  terms: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function EnhancedContactForm() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general',
    company: '',
    phone: '',
    preferredContact: 'email',
    timeline: '',
    budget: '',
    attachments: [],
    newsletter: false,
    terms: false
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showLiveChat, setShowLiveChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check user permissions for contact features
  const hasContactPermissions = () => {
    if (status === 'loading') return false;
    if (!session?.user) return false;
    
    // Allow access for authenticated users with specific roles or permissions
    const userRole = session.user.role;
    const userPermissions = (session.user as any).permissions || [];
    
    // Allow access for admin, editor, author roles or users with contact permissions
    return (
      userRole === 'admin' || 
      userRole === 'editor' || 
      userRole === 'author' ||
      userPermissions.includes('contact_access') ||
      userPermissions.includes('live_chat') ||
      userPermissions.includes('schedule_meeting')
    );
  };

  const hasLiveChatAccess = () => {
    if (!hasContactPermissions()) return false;
    const userPermissions = (session?.user as any)?.permissions || [];
    return (
      session?.user?.role === 'admin' ||
      session?.user?.role === 'editor' ||
      userPermissions.includes('live_chat')
    );
  };

  const hasCallAccess = () => {
    if (!hasContactPermissions()) return false;
    const userPermissions = (session?.user as any)?.permissions || [];
    return (
      session?.user?.role === 'admin' ||
      session?.user?.role === 'editor' ||
      userPermissions.includes('phone_contact')
    );
  };

  const hasScheduleMeetingAccess = () => {
    if (!hasContactPermissions()) return false;
    const userPermissions = (session?.user as any)?.permissions || [];
    return (
      session?.user?.role === 'admin' ||
      session?.user?.role === 'editor' ||
      userPermissions.includes('schedule_meeting')
    );
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (!formData.terms) newErrors.terms = 'You must accept the terms and conditions';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (if provided)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Access request specific validation
    if (formData.category === 'access-request' && !formData.accessLevel) {
      newErrors.accessLevel = 'Please select an access level';
    }

    // File size validation (max 10MB per file)
    formData.attachments.forEach((file, index) => {
      if (file.size > 10 * 1024 * 1024) {
        newErrors[`attachment_${index}`] = `File "${file.name}" is too large (max 10MB)`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats'];
      return validTypes.some(type => file.type.startsWith(type)) && file.size <= 10 * 1024 * 1024;
    });

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'attachments') {
          if (typeof value === 'boolean') {
            submitData.append(key, value.toString());
          } else if (value) {
            submitData.append(key, value.toString());
          }
        }
      });

      // Add attachments
      formData.attachments.forEach((file, index) => {
        submitData.append(`attachment_${index}`, file);
      });

      // Submit to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general',
        company: '',
        phone: '',
        preferredContact: 'email',
        timeline: '',
        budget: '',
        attachments: [],
        newsletter: false,
        terms: false
      });

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'contact_form_submit', {
          event_category: 'engagement',
          event_label: formData.category,
          value: 1
        });
      }

    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Success Message */}
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Message sent successfully!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Thank you for your message. I'll get back to you within 24 hours. You should receive an auto-confirmation email shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Failed to send message
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                There was an error sending your message. Please try again or contact me directly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        {(hasLiveChatAccess() || hasCallAccess() || hasScheduleMeetingAccess()) && (
          <div className="flex flex-wrap gap-3 mb-4">
            {hasLiveChatAccess() && (
              <button
                type="button"
                onClick={() => setShowLiveChat(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Live Chat
              </button>
            )}
            {hasCallAccess() && (
              <a
                href="tel:+1234567890"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Call Now
              </a>
            )}
            {hasScheduleMeetingAccess() && (
              <a
                href="https://calendly.com/your-link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Meeting
              </a>
            )}
          </div>
        )}
        
        {status === 'unauthenticated' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Additional Contact Options Available
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  <a href="/admin/login" className="font-medium underline hover:no-underline">
                    Sign in
                  </a> to access live chat, direct calling, and meeting scheduling options.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {status === 'authenticated' && !hasContactPermissions() && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Limited Access
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Your account doesn't have permission to access live chat, calling, or meeting scheduling. 
                  Please contact an administrator to request additional permissions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="Enter your email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>

        {/* Additional Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company/Organization
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Your company or organization"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>
        </div>

        {/* Message Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="general">General Inquiry</option>
              <option value="project">Project Discussion</option>
              <option value="collaboration">Collaboration</option>
              <option value="support">Technical Support</option>
              <option value="access-request">Access Request</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getPriorityColor(formData.priority)} dark:bg-gray-700 dark:text-white`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label htmlFor="preferredContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Contact Method
            </label>
            <select
              id="preferredContact"
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
              <option value="video-call">Video Call</option>
            </select>
          </div>
        </div>

        {/* Access Request Fields */}
        {formData.category === 'access-request' && (
          <div>
            <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Requested Access Level *
            </label>
            <select
              id="accessLevel"
              name="accessLevel"
              value={formData.accessLevel || ''}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.accessLevel ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            >
              <option value="">Select access level</option>
              <option value="author">Author - Can create and edit own content</option>
              <option value="editor">Editor - Can edit all content</option>
              <option value="admin">Admin - Full system access</option>
            </select>
            {errors.accessLevel && <p className="mt-1 text-sm text-red-600">{errors.accessLevel}</p>}
          </div>
        )}

        {/* Project Details */}
        {formData.category === 'project' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Timeline
              </label>
              <select
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select timeline</option>
                <option value="asap">ASAP</option>
                <option value="1-month">Within 1 month</option>
                <option value="3-months">Within 3 months</option>
                <option value="6-months">Within 6 months</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget Range
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select budget range</option>
                <option value="under-5k">Under $5,000</option>
                <option value="5k-15k">$5,000 - $15,000</option>
                <option value="15k-50k">$15,000 - $50,000</option>
                <option value="50k-plus">$50,000+</option>
                <option value="discuss">Let's discuss</option>
              </select>
            </div>
          </div>
        )}

        {/* Subject and Message */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              errors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            placeholder="Brief description of your inquiry"
          />
          {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={formData.message}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical ${
              errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            placeholder="Please provide details about your inquiry..."
          />
          {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formData.message.length}/2000 characters
          </p>
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Attachments (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            />
            <PaperClipIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Click to upload files or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              PDF, DOC, TXT, Images (max 10MB each)
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Choose Files
            </button>
          </div>

          {/* Attachment List */}
          {formData.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <PaperClipIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="newsletter"
              name="newsletter"
              checked={formData.newsletter}
              onChange={handleInputChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="newsletter" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Subscribe to my newsletter for updates on new projects and blog posts
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={formData.terms}
              onChange={handleInputChange}
              className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                errors.terms ? 'border-red-500' : ''
              }`}
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              I agree to the <a href="/privacy" className="text-blue-600 hover:text-blue-800">privacy policy</a> and 
              <a href="/terms" className="text-blue-600 hover:text-blue-800 ml-1">terms of service</a> *
            </label>
          </div>
          {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50'
            } text-white`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Message...
              </div>
            ) : (
              'Send Message'
            )}
          </button>
        </div>
      </form>

      {/* Live Chat Modal */}
      {showLiveChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Live Chat</h3>
              <button
                onClick={() => setShowLiveChat(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Live chat is currently offline. Please use the contact form or schedule a meeting instead.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowLiveChat(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Use Contact Form
                </button>
                <a
                  href="https://calendly.com/your-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
                >
                  Schedule Meeting
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 