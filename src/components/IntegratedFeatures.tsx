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
          subscriberCount={2847}
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
        subscriberCount={2847}
      />
    </div>
  );
};

// Example of touch-friendly action buttons
export const TouchFriendlyActions: React.FC = () => {
  const handleLike = () => {
    console.log('Post liked!');
  };

  const handleShare = () => {
    console.log('Share post!');
  };

  const handleComment = () => {
    console.log('Add comment!');
  };

  return (
    <div className="flex gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <TouchButton
        onClick={handleLike}
        variant="ghost"
        size="md"
        className="flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span>Like</span>
      </TouchButton>

      <TouchButton
        onClick={handleShare}
        variant="ghost"
        size="md"
        className="flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        <span>Share</span>
      </TouchButton>

      <TouchButton
        onClick={handleComment}
        variant="primary"
        size="md"
        className="flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>Comment</span>
      </TouchButton>
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
          subscriberCount={2847}
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
            incentive="Join 2,800+ developers"
            showSocialProof={true}
            subscriberCount={2847}
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