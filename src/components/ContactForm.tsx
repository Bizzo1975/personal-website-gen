'use client';

import React, { useState, useRef } from 'react';
import { ValidationError } from '@/lib/utils/form-validation';
import ReCaptcha from './ReCaptcha';

interface ContactFormProps {
  className?: string;
  defaultRequestType?: 'contact' | 'access_request';
}

const ContactForm: React.FC<ContactFormProps> = ({ 
  className = '', 
  defaultRequestType = 'contact' 
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    requestType: defaultRequestType,
    requestedAccessLevel: 'personal' as 'personal' | 'professional'
  });
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  
  // reCAPTCHA state
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<boolean>(false);
  
  // Form and field references
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear field-specific errors when the user types
    setFieldErrors(prev => prev.filter(error => error.field !== name));
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle request type change
  const handleRequestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const requestType = e.target.value as 'contact' | 'access_request';
    setFormData(prev => ({
      ...prev,
      requestType,
      // Auto-populate subject for access requests
      subject: requestType === 'access_request' 
        ? `Access Request - ${prev.requestedAccessLevel}`
        : prev.subject
    }));
  };

  // Handle access level change
  const handleAccessLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accessLevel = e.target.value as 'personal' | 'professional';
    setFormData(prev => ({
      ...prev,
      requestedAccessLevel: accessLevel,
      // Update subject if it's an access request
      subject: prev.requestType === 'access_request' 
        ? `Access Request - ${accessLevel}`
        : prev.subject
    }));
  };
  
  // Handle reCAPTCHA verification
  const handleRecaptchaVerify = (token: string | null) => {
    setRecaptchaToken(token);
    setRecaptchaError(false);
  };
  
  // Handle reCAPTCHA expiration
  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
  };
  
  // Get field error message
  const getFieldErrorMessage = (fieldName: string) => {
    const error = fieldErrors.find(e => e.field === fieldName);
    return error ? error.message : undefined;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset submission state
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);
    setFieldErrors([]);
    
    // Check reCAPTCHA
    if (!recaptchaToken) {
      setRecaptchaError(true);
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Determine API endpoint based on request type
      const endpoint = formData.requestType === 'access_request' 
        ? '/api/access-requests' 
        : '/api/contact';
      
      // Prepare request data based on type
      const requestData = formData.requestType === 'access_request' 
        ? {
            name: (formData.name || '').trim(),
            email: (formData.email || '').trim(),
            message: (formData.message || '').trim(),
            requestedAccessLevel: formData.requestedAccessLevel,
            recaptchaToken: recaptchaToken || null
          }
        : {
            name: (formData.name || '').trim(),
            email: (formData.email || '').trim(),
            subject: (formData.subject || '').trim(),
            message: (formData.message || '').trim(),
            recaptchaToken: recaptchaToken || null
          };
      
      // Validate data before sending
      if (!requestData.name || !requestData.email) {
        setSubmitError('Name and email are required');
        setIsSubmitting(false);
        return;
      }
      
      // Stringify with error handling
      let requestBody;
      try {
        requestBody = JSON.stringify(requestData);
        console.log('Sending request data:', { ...requestData, recaptchaToken: requestData.recaptchaToken ? '[REDACTED]' : null });
      } catch (stringifyError) {
        console.error('Error stringifying request data:', stringifyError);
        setSubmitError('Error preparing request data. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Send the form data to the appropriate API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
      
      // Check if response is JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, read as text for error details
        const text = await response.text();
        console.error('Non-JSON response:', text);
        setSubmitError(`Server error (${response.status}): ${text.substring(0, 200)}`);
        setIsSubmitting(false);
        return;
      }
      
      if (!response.ok) {
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          setFieldErrors(data.errors);
          
          // Focus the first field with an error
          if (data.errors.length > 0 && data.errors[0].field === 'name' && nameInputRef.current) {
            nameInputRef.current.focus();
          }
        } else {
          // Handle general error with more details
          const errorMsg = data.error || data.message || `Failed to submit (${response.status}). Please try again.`;
          setSubmitError(errorMsg);
          
          // Log additional details in development
          if (process.env.NODE_ENV === 'development' && data.details) {
            console.error('Error details:', data.details);
          }
        }
        
        setIsSubmitting(false);
        return;
      }
      
      // Handle success
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        requestType: defaultRequestType,
        requestedAccessLevel: 'personal'
      });
      
      // Reset reCAPTCHA
      setRecaptchaToken(null);
      
      // Reset form element
      if (formRef.current) {
        formRef.current.reset();
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Provide more detailed error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setSubmitError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error instanceof Error) {
        setSubmitError(`Error: ${error.message}. Please try again later.`);
      } else {
        setSubmitError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className={`contact-form space-y-6 ${className}`}
      noValidate
      aria-label="Contact form"
    >
      {/* Success message */}
      {submitSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-green-700 dark:text-green-300 font-medium">
            {formData.requestType === 'access_request' 
              ? `Your ${formData.requestedAccessLevel} access request has been submitted successfully! We'll review it and get back to you soon.`
              : 'Thank you for your message! We\'ll get back to you as soon as possible.'
            }
          </p>
        </div>
      )}
      
      {/* Error message */}
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 font-medium">
            {submitError}
          </p>
        </div>
      )}

      {/* Request Type Selection */}
      <div className="form-group">
        <label 
          htmlFor="requestType" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Request Type <span className="text-red-500">*</span>
        </label>
        <select
          id="requestType"
          name="requestType"
          value={formData.requestType}
          onChange={handleRequestTypeChange}
          required
          aria-required="true"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:ring-opacity-50 dark:bg-gray-800"
          disabled={isSubmitting}
        >
          <option value="contact">General Contact</option>
          <option value="access_request">Access Request</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formData.requestType === 'access_request' 
            ? 'Request access to register and use platform features'
            : 'Send a general message or inquiry'
          }
        </p>
      </div>

      {/* Access Level Selection (only for access requests) */}
      {formData.requestType === 'access_request' && (
        <div className="form-group">
          <label 
            htmlFor="requestedAccessLevel" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Access Level <span className="text-red-500">*</span>
          </label>
          <select
            id="requestedAccessLevel"
            name="requestedAccessLevel"
            value={formData.requestedAccessLevel}
            onChange={handleAccessLevelChange}
            required
            aria-required="true"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:ring-opacity-50 dark:bg-gray-800"
            disabled={isSubmitting}
          >
            <option value="personal">Personal Access</option>
            <option value="professional">Professional Access</option>
          </select>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.requestedAccessLevel === 'professional' ? (
              <span>Professional access includes advanced features and content</span>
            ) : (
              <span>Personal access provides basic features and content</span>
            )}
          </div>
        </div>
      )}
      
      {/* Name field */}
      <div className="form-group">
        <label 
          htmlFor="name" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          ref={nameInputRef}
          value={formData.name}
          onChange={handleChange}
          required
          aria-required="true"
          aria-invalid={!!getFieldErrorMessage('name')}
          aria-describedby={getFieldErrorMessage('name') ? 'name-error' : undefined}
          className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 ${
            getFieldErrorMessage('name')
              ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
              : 'border-gray-300 focus:ring-blue-200 dark:focus:ring-blue-800'
          }`}
          disabled={isSubmitting}
        />
        {getFieldErrorMessage('name') && (
          <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {getFieldErrorMessage('name')}
          </p>
        )}
      </div>
      
      {/* Email field */}
      <div className="form-group">
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          aria-required="true"
          aria-invalid={!!getFieldErrorMessage('email')}
          aria-describedby={getFieldErrorMessage('email') ? 'email-error' : undefined}
          className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 ${
            getFieldErrorMessage('email')
              ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
              : 'border-gray-300 focus:ring-blue-200 dark:focus:ring-blue-800'
          }`}
          disabled={isSubmitting}
        />
        {getFieldErrorMessage('email') && (
          <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {getFieldErrorMessage('email')}
          </p>
        )}
      </div>
      
      {/* Subject field (only for contact requests) */}
      {formData.requestType === 'contact' && (
        <div className="form-group">
          <label 
            htmlFor="subject" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            aria-required="true"
            aria-invalid={!!getFieldErrorMessage('subject')}
            aria-describedby={getFieldErrorMessage('subject') ? 'subject-error' : undefined}
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 ${
              getFieldErrorMessage('subject')
                ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
                : 'border-gray-300 focus:ring-blue-200 dark:focus:ring-blue-800'
            }`}
            disabled={isSubmitting}
          />
          {getFieldErrorMessage('subject') && (
            <p id="subject-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {getFieldErrorMessage('subject')}
            </p>
          )}
        </div>
      )}
      
      {/* Message field */}
      <div className="form-group">
        <label 
          htmlFor="message" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {formData.requestType === 'access_request' ? 'Reason for Access Request' : 'Message'} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          required
          aria-required="true"
          aria-invalid={!!getFieldErrorMessage('message')}
          aria-describedby={getFieldErrorMessage('message') ? 'message-error' : undefined}
          placeholder={formData.requestType === 'access_request' 
            ? 'Please explain why you need access and how you plan to use the platform...'
            : 'Enter your message here...'
          }
          className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 ${
            getFieldErrorMessage('message')
              ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
              : 'border-gray-300 focus:ring-blue-200 dark:focus:ring-blue-800'
          }`}
          disabled={isSubmitting}
        />
        {getFieldErrorMessage('message') && (
          <p id="message-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {getFieldErrorMessage('message')}
          </p>
        )}
      </div>
      
      {/* reCAPTCHA */}
      <div className="form-group">
        <ReCaptcha 
          onVerify={handleRecaptchaVerify}
          onExpired={handleRecaptchaExpired}
          className="mt-4"
        />
        
        {recaptchaError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            Please complete the reCAPTCHA verification.
          </p>
        )}
      </div>
      
      {/* Submit button */}
      <div className="form-group">
        <button
          type="submit"
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? (
            formData.requestType === 'access_request' ? 'Submitting Request...' : 'Sending...'
          ) : (
            formData.requestType === 'access_request' ? 'Submit Access Request' : 'Send Message'
          )}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
