'use client';

import React, { useState } from 'react';
import BlogComments from './BlogComments';
import NewsletterSignup from './NewsletterSignup';
import { MobileNavigation, TouchButton, SwipeableImageGallery, useViewportOptimization } from './MobileEnhancements';

// Example integration for blog post page
interface BlogPostWithFeaturesProps {
  postId: string;
  postTitle: string;
  postImages?: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
}

export const BlogPostWithFeatures: React.FC<BlogPostWithFeaturesProps> = ({
  postId,
  postTitle,
  postImages = []
}) => {
  const { isMobile } = useViewportOptimization();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Main Content */}
      <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <h1>{postTitle}</h1>
        
        {/* Image Gallery (if images provided) */}
        {postImages.length > 0 && (
          <SwipeableImageGallery 
            images={postImages}
            className="my-8"
          />
        )}
        
        {/* Article content would go here */}
        <p>This is where your blog post content would be displayed...</p>
      </article>

      {/* Newsletter Signup - Contextual placement */}
      <div className="my-12">
        <NewsletterSignup
          variant={isMobile ? 'sidebar' : 'inline'}
          title="Enjoyed this article?"
          description="Get notified when I publish new content like this."
          incentive="✨ Plus get exclusive tips and early access to new posts"
          showSocialProof={true}
        />
      </div>

      {/* Comments Section */}
      <div className="mt-16">
        <BlogComments
          postId={postId}
          postTitle={postTitle}
          allowAnonymous={true}
          moderationEnabled={true}
          maxDepth={3}
        />
      </div>
    </div>
  );
};

// Example mobile-first navigation
interface MobileAppLayoutProps {
  children: React.ReactNode;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isMobile } = useViewportOptimization();

  const navigationItems = [
    {
      label: 'Home',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: 'Blog',
      href: '/blog',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      badge: 'New'
    },
    {
      label: 'Projects',
      href: '/projects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      label: 'About',
      href: '/about',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      label: 'Contact',
      href: '/contact',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">YS</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Your Site
            </h1>
          </div>

          {isMobile && (
            <MobileNavigation
              isOpen={isMobileNavOpen}
              onToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
              navigationItems={navigationItems}
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Newsletter Popup (exit-intent) */}
      <NewsletterSignup
        variant="popup"
        title="Before You Go..."
        description="Join thousands of developers getting weekly insights!"
        incentive="🔥 Exclusive content + Free resources"
        showSocialProof={true}
      />
    </div>
  );
};

const PerformanceOptimization: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Performance monitoring dashboard would go here */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">Performance Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">98</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Performance Score</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1.2s</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Load Time</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0.1s</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">First Paint</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Newsletter variants showcase
export const NewsletterVariantsShowcase: React.FC = () => {
  return (
    <div className="space-y-12 p-8">
      {/* Inline variant */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Inline Newsletter Signup</h3>
        <NewsletterSignup
          variant="inline"
          title="Subscribe to the Newsletter"
          description="Get notified when I publish new articles and tutorials."
          incentive="✨ Plus exclusive tips and early access to new content"
          showSocialProof={true}
        />
      </div>

      {/* Sidebar variant */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Sidebar Newsletter Signup</h3>
        <div className="max-w-sm">
          <NewsletterSignup
            variant="sidebar"
            title="Newsletter"
            description="Weekly insights on web development."
            incentive="Join developers worldwide"
            showSocialProof={true}
          />
        </div>
      </div>

      {/* Footer variant */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Footer Newsletter Signup</h3>
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg">
          <NewsletterSignup
            variant="footer"
            title="Subscribe to Newsletter"
            description="Stay informed with our latest posts and updates."
            incentive="No spam, unsubscribe at any time"
            showSocialProof={false}
          />
        </div>
      </div>
    </div>
  );
};

export default {
  BlogPostWithFeatures,
  MobileAppLayout,
  TouchFriendlyActions,
  NewsletterVariantsShowcase
}; 