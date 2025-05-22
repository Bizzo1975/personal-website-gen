'use client';

import React, { useState, useMemo } from 'react';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { ProfileData } from '@/lib/services/profile-service';
import MarkdownContent from '@/components/MarkdownContent';
import HeaderSection from '@/components/HeaderSection';

interface ContactContentProps {
  content: MDXRemoteSerializeResult;
  profile: ProfileData;
}

export default function ContactContent({ content, profile }: ContactContentProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  
  // Create a version of the content without the "Contact Me" heading
  const filteredContent = useMemo(() => {
    if (!content || !content.compiledSource) return content;
    
    // Create a clone of the content object to avoid mutating the original
    const contentClone = { ...content };
    
    // Replace patterns like "# Contact Me" at the beginning of the content
    if (typeof contentClone.compiledSource === 'string') {
      contentClone.compiledSource = contentClone.compiledSource
        // Replace MDX compiled h1 with Contact Me
        .replace(/<h1.*?>Contact Me<\/h1>/, '')
        // Also remove empty paragraphs that might follow
        .replace(/<p>\s*<\/p>/, '');
    }
    
    return contentClone;
  }, [content]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult({});
    
    // In a real application, you would send this data to your API
    // For this demo, we'll just simulate a successful submission
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the form data for demonstration
      console.log('Form submitted:', formData);
      
      // Show success message
      setSubmitResult({
        success: true,
        message: 'Your message has been sent! I will get back to you soon.'
      });
      
      // Reset form fields
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitResult({
        success: false,
        message: 'Sorry, there was an error sending your message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <HeaderSection 
        title="Contact Me"
        subtitle="Have a question or want to work together? Get in touch with me using the form below or through any of my social channels."
        showSlideshow={true}
        className="bg-gradient-secondary"
        compact={true}
      />
      
      {/* Contact Section */}
      <section className="section-modern">
        <div className="container-modern">
          <div className="grid md:grid-cols-12 gap-12">
            {/* Contact Info */}
            <div className="md:col-span-5">
              <div className="prose prose-lg dark:prose-invert mb-8">
                <MarkdownContent content={filteredContent} />
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">Email</h3>
                        <a href={`mailto:${profile.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {profile.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {profile.location && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">Location</h3>
                        <p className="text-slate-700 dark:text-slate-300">{profile.location}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Social Links */}
                {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Connect With Me</h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.socialLinks.github && (
                        <a 
                          href={profile.socialLinks.github}
                          target="_blank" 
                          rel="noopener noreferrer"
                          aria-label="GitHub"
                          className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.839c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                          </svg>
                        </a>
                      )}
                      
                      {profile.socialLinks.twitter && (
                        <a 
                          href={profile.socialLinks.twitter}
                          target="_blank" 
                          rel="noopener noreferrer"
                          aria-label="Twitter"
                          className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                        </a>
                      )}
                      
                      {profile.socialLinks.linkedin && (
                        <a 
                          href={profile.socialLinks.linkedin}
                          target="_blank" 
                          rel="noopener noreferrer"
                          aria-label="LinkedIn"
                          className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                      
                      {profile.socialLinks.website && (
                        <a 
                          href={profile.socialLinks.website}
                          target="_blank" 
                          rel="noopener noreferrer"
                          aria-label="Website"
                          className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="md:col-span-7">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Send Me a Message</h2>
                
                {submitResult.message && (
                  <div className={`p-4 mb-6 rounded-lg ${
                    submitResult.success 
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                  }`}>
                    {submitResult.message}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block mb-2 font-medium">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block mb-2 font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your email"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block mb-2 font-medium">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Subject"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block mb-2 font-medium">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your message"
                      required
                      disabled={isSubmitting}
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 