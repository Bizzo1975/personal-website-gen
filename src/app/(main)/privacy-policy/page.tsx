import React from 'react';
import HeaderSection from '@/components/HeaderSection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Personal Website',
  description: 'Our privacy policy outlines how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <HeaderSection 
        title="Privacy Policy"
        subtitle="Your privacy is important to us. This policy explains how we collect, use, and protect your information."
        compact={true}
      />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                <p>When you interact with our website, we may collect the following personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name and email address (when subscribing to our newsletter)</li>
                  <li>Contact information (when submitting contact forms)</li>
                  <li>Access request information (when requesting special access to content)</li>
                  <li>Comments and feedback you provide</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automatically Collected Information</h3>
                <p>We automatically collect certain information when you visit our website:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>IP address and browser information</li>
                  <li>Device type and operating system</li>
                  <li>Pages visited and time spent on our site</li>
                  <li>Referring website information</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We use the information we collect for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Newsletter Communications:</strong> To send you updates, articles, and relevant content via our newsletter (only with your consent)</li>
                  <li><strong>Website Functionality:</strong> To provide access to restricted content based on your access level</li>
                  <li><strong>Communication:</strong> To respond to your inquiries and contact form submissions</li>
                  <li><strong>Website Improvement:</strong> To analyze website usage and improve our content and user experience</li>
                  <li><strong>Security:</strong> To protect our website and users from security threats</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Newsletter Subscription</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consent and Subscription</h3>
                <p>By subscribing to our newsletter, you explicitly consent to receive email communications from us. You can:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Subscribe voluntarily through our website forms</li>
                  <li>Unsubscribe at any time using the link in our emails</li>
                  <li>Update your subscription preferences</li>
                  <li>Request deletion of your subscription data</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Service Provider</h3>
                <p>We use SendGrid to manage and send our newsletter emails. SendGrid complies with data protection regulations and maintains appropriate security measures.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Cookies and Tracking</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>Our website uses cookies and similar technologies for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for website functionality and user authentication</li>
                  <li><strong>Analytics Cookies:</strong> To understand how visitors use our website (anonymized data)</li>
                  <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
                </ul>
                <p>You can control cookie settings through your browser preferences.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Third-Party Services</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We may use the following third-party services that may collect information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>SendGrid:</strong> For email delivery and newsletter management</li>
                  <li><strong>Analytics Services:</strong> For website traffic analysis (anonymized)</li>
                  <li><strong>Authentication Services:</strong> For secure user login and access control</li>
                </ul>
                <p>These services have their own privacy policies and data handling practices.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Data Security</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We implement appropriate security measures to protect your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security audits and updates</li>
                  <li>Limited access to personal information on a need-to-know basis</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Data Retention</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We retain your personal information for the following periods:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Newsletter Subscriptions:</strong> Until you unsubscribe or request deletion</li>
                  <li><strong>Contact Form Data:</strong> For 2 years after submission</li>
                  <li><strong>Access Request Data:</strong> For 3 years for audit purposes</li>
                  <li><strong>Analytics Data:</strong> Anonymized data may be retained indefinitely</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Your Rights</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request your data in a portable format</li>
                  <li><strong>Unsubscribe:</strong> Opt out of newsletter communications at any time</li>
                  <li><strong>Object:</strong> Object to processing of your personal information</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Children's Privacy</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Changes to This Policy</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We may update this privacy policy from time to time. When we make changes, we will:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Update the "Last updated" date at the top of this policy</li>
                  <li>Notify newsletter subscribers of significant changes</li>
                  <li>Post the updated policy on our website</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Contact Us</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>If you have any questions about this privacy policy or how we handle your personal information, please contact us:</p>
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mt-4">
                  <p><strong>Email:</strong> privacy@personalwebsite.com</p>
                  <p><strong>Contact Form:</strong> <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Visit our contact page</a></p>
                </div>
                <p>We will respond to your inquiry within 30 days.</p>
              </div>
            </section>

            <div className="border-t border-gray-200 dark:border-slate-600 pt-8 mt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This privacy policy is effective as of the date listed above and applies to all information collected by this website.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 