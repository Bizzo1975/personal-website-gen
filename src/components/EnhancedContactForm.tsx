'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  PaperClipIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: 'general' | 'project' | 'collaboration' | 'access-request' | '';
  company?: string;
  phone?: string;
  timeline?: string;
  budget?: string;
  attachments: File[];
  newsletter: boolean;
  terms: boolean;
  requestType?: 'contact' | 'access-request';
  requestedAccessLevel?: 'personal' | 'professional';
}

interface ValidationErrors {
  [key: string]: string;
}

export default function EnhancedContactForm() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '',
    company: '',
    phone: '',
    timeline: '',
    budget: '',
    attachments: [],
    newsletter: false,
    terms: false,
    requestType: undefined,
    requestedAccessLevel: undefined
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }
    if (!formData.terms) newErrors.terms = 'You must accept the terms and conditions';

    // Access request specific validation
    if (formData.category === 'access-request') {
      if (!formData.requestedAccessLevel) newErrors.requestedAccessLevel = 'Please select an access level';
    }

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

  const handleCategorySelect = (category: 'general' | 'project' | 'collaboration' | 'access-request') => {
    setFormData(prev => ({ 
      ...prev, 
      category: prev.category === category ? '' : category,
      requestType: category === 'access-request' ? 'access-request' : 'contact',
      // Auto-populate subject for access requests
      subject: category === 'access-request' ? 'Access Request' : prev.subject
    }));
    
    // Clear category error when user selects
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
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

      // Determine API endpoint based on category
      const apiEndpoint = formData.category === 'access-request' ? '/api/access-requests' : '/api/contact';

      console.log('📧 Submitting contact form:', {
        category: formData.category,
        endpoint: apiEndpoint,
        hasName: !!formData.name,
        hasEmail: !!formData.email,
        hasSubject: !!formData.subject,
        hasMessage: !!formData.message
      });

      // For access-requests, send JSON. For contact, send FormData
      let requestBody: globalThis.FormData | string;
      let headers: HeadersInit = {};
      
      if (formData.category === 'access-request') {
        // Send JSON for access-requests endpoint
        requestBody = JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          requestedAccessLevel: formData.requestedAccessLevel || 'personal',
          recaptchaToken: null // Add if you have reCAPTCHA
        });
        headers = { 'Content-Type': 'application/json' };
      } else {
        // Send FormData for contact endpoint (supports file uploads)
        requestBody = submitData;
      }

      // Submit to API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      if (!response.ok) {
        let errorData: any;
        let errorMessage = `Server error: ${response.status}`;
        
        try {
          const responseText = await response.text();
          console.error('❌ Contact form API error response (status ' + response.status + '):', responseText);
          
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              errorMessage = errorData?.error || errorData?.message || errorData?.details || errorMessage;
              console.error('❌ Parsed error data:', JSON.stringify(errorData, null, 2));
            } catch (parseError) {
              console.error('❌ Failed to parse JSON, raw response:', responseText);
              errorMessage = responseText.substring(0, 200) || errorMessage;
            }
          }
        } catch (textError) {
          console.error('❌ Failed to read error response:', textError);
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        
        // Log the actual error message clearly
        console.error('❌ CONTACT FORM ERROR:', errorMessage);
        console.error('❌ Full error details:', {
          status: response.status,
          statusText: response.statusText,
          endpoint: apiEndpoint,
          category: formData.category,
          errorMessage: errorMessage
        });
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: '',
        company: '',
        phone: '',
        timeline: '',
        budget: '',
        attachments: [],
        newsletter: false,
        terms: false,
        requestType: undefined,
        requestedAccessLevel: undefined
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

  return (
    <div className="relative">
      {/* Success Message */}
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                {formData.category === 'access-request' ? 'Access request submitted successfully!' : 'Message sent successfully!'}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {formData.category === 'access-request' 
                  ? 'Your access request has been submitted and will be reviewed within 24 hours. You will receive an email notification once your request is processed.'
                  : 'Thank you for your message. I\'ll get back to you within 24 hours. You should receive an auto-confirmation email shortly.'
                }
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

        {/* Category Selection Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            What can I help you with? *
          </label>
          <div className="flex flex-wrap gap-4 mb-2">
            <button
              type="button"
              onClick={() => handleCategorySelect('general')}
              className={`${
                formData.category === 'general'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-blue-400/20 to-blue-500/20 hover:from-blue-500 hover:to-blue-600 text-blue-700 dark:text-blue-300 hover:text-white border border-blue-300 dark:border-blue-600'
              } font-medium rounded-full px-6 py-3 transition-all duration-300 shadow-md hover:shadow-lg`}
            >
              General Inquiry
            </button>
            
            <button
              type="button"
              onClick={() => handleCategorySelect('project')}
              className={`${
                formData.category === 'project'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg border border-purple-400/30'
                  : 'bg-gradient-to-r from-purple-400/20 to-indigo-500/20 hover:from-purple-600 hover:to-indigo-700 text-purple-700 dark:text-purple-300 hover:text-white border border-purple-300 dark:border-purple-600'
              } font-medium rounded-full px-6 py-3 transition-all duration-300 shadow-md hover:shadow-lg`}
            >
              Project Discussion
            </button>
            
            <button
              type="button"
              onClick={() => handleCategorySelect('collaboration')}
              className={`${
                formData.category === 'collaboration'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-300 dark:border-emerald-600'
              } font-medium rounded-full px-6 py-3 transition-all duration-300 shadow-md hover:shadow-lg`}
            >
              Collaboration
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('access-request')}
              className={`${
                formData.category === 'access-request'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-yellow-400/20 to-orange-500/20 hover:from-yellow-500 hover:to-orange-600 text-yellow-700 dark:text-yellow-300 hover:text-white border border-yellow-300 dark:border-yellow-600'
              } font-medium rounded-full px-6 py-3 transition-all duration-300 shadow-md hover:shadow-lg`}
            >
              Access Request
            </button>
          </div>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        {/* Show remaining fields only when category is selected */}
        {formData.category && (
          <>
            {/* Project Fields - Show for project category */}
            {formData.category === 'project' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Timeline
                  </label>
                  <input
                    type="text"
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 2-3 months, ASAP, Flexible"
                  />
                </div>

                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget Range
                  </label>
                  <input
                    type="text"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., $5,000 - $10,000"
                  />
                </div>
              </div>
            )}

            {/* Access Request Fields - Show for access-request category */}
            {formData.category === 'access-request' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Access Level Requested *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="personal"
                      name="requestedAccessLevel"
                      value="personal"
                      checked={formData.requestedAccessLevel === 'personal'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor="personal" className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Personal Access</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        For personal use, exploration, and learning
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="professional"
                      name="requestedAccessLevel"
                      value="professional"
                      checked={formData.requestedAccessLevel === 'professional'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor="professional" className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Professional Access</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        For business, commercial, or professional use
                      </div>
                    </label>
                  </div>
                </div>
                {errors.requestedAccessLevel && <p className="mt-1 text-sm text-red-600">{errors.requestedAccessLevel}</p>}
              </div>
            )}

            {/* Subject */}
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
                placeholder="What's this about?"
              />
              {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
            </div>

            {/* Message */}
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder={
                  formData.category === 'project' 
                    ? "Tell me about your project requirements, goals, and any specific features you need..."
                    : formData.category === 'collaboration'
                    ? "Describe the collaboration opportunity or partnership you have in mind..."
                    : formData.category === 'access-request'
                    ? "Please describe your intended use of the platform and why you need access. Include any relevant background information that would help in processing your request..."
                    : "Tell me about your question or how I can help you..."
                }
              />
              <div className="mt-1">
                {errors.message && <p className="text-sm text-red-600 dark:text-red-400 mb-1">{errors.message}</p>}
                <p className={`text-xs ${formData.message.trim().length < 10 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  Minimum 10 characters required ({formData.message.trim().length}/10)
                </p>
              </div>
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                />
                <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Click to upload files
                  </button>
                  {' '}or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, PDF, DOC up to 10MB each
                </p>
              </div>

              {/* Uploaded Files */}
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <PaperClipIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter Subscription */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="newsletter"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="newsletter" className="text-sm text-gray-700 dark:text-gray-300">
                Subscribe to my newsletter for updates on new projects and blog posts
              </label>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={formData.terms}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the terms and conditions and privacy policy *
              </label>
            </div>
            {errors.terms && <p className="mt-1 text-sm text-red-600">{errors.terms}</p>}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
} 