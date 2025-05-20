'use client';

import React, { useState, useRef } from 'react';
import { ValidationError } from '@/lib/utils/form-validation';
import ReCaptcha from './ReCaptcha';

interface ContactFormProps {
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ className = '' }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear field-specific errors when the user types
    setFieldErrors(prev => prev.filter(error => error.field !== name));
    
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      // Send the form data to the API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          setFieldErrors(data.errors);
          
          // Focus the first field with an error
          if (data.errors.length > 0 && data.errors[0].field === 'name' && nameInputRef.current) {
            nameInputRef.current.focus();
          }
        } else {
          // Handle general error
          setSubmitError(data.error || 'Failed to send message. Please try again.');
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
        message: ''
      });
      
      // Reset reCAPTCHA
      setRecaptchaToken(null);
      
      // Reset form element
      if (formRef.current) {
        formRef.current.reset();
      }
      
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again later.');
      console.error('Contact form submission error:', error);
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
            Thank you for your message! We'll get back to you as soon as possible.
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
      
      {/* Subject field */}
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
      
      {/* Message field */}
      <div className="form-group">
        <label 
          htmlFor="message" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Message <span className="text-red-500">*</span>
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
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
