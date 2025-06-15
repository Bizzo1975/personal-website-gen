'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon, IconButton, IconWithText, StatusIcon } from './IconSystem';
import { EnhancedAnimatedElement, StaggeredChildren } from './EnhancedAnimationLibrary';
import { Logo } from './Logo';

interface DesignSystemDemoProps {
  className?: string;
}

export const DesignSystemDemo: React.FC<DesignSystemDemoProps> = ({ className = '' }) => {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <EnhancedAnimatedElement type="bounce" repeat={true}>
          <button
            onClick={() => setShowDemo(true)}
            className="bg-gradient-primary text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Show Design System Demo"
          >
            <Icon name="sparkles" size="md" />
          </button>
        </EnhancedAnimatedElement>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <EnhancedAnimatedElement type="slideUp">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-6 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Icon name="sparkles" size="sm" color="primary" />
              <h3 className="heading-5">Design System</h3>
            </div>
            <button
              onClick={() => setShowDemo(false)}
              className="text-secondary hover:text-primary"
              aria-label="Close demo"
            >
              <Icon name="x" size="sm" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Logo Demo */}
            <div className="text-center p-3 bg-surface-secondary rounded-lg">
              <Logo variant="full" size="md" />
              <p className="text-caption mt-2">Logo Component</p>
            </div>

            {/* Icons Demo */}
            <div>
              <p className="text-body-small font-medium mb-2">Icon System</p>
              <div className="flex items-center space-x-2">
                <Icon name="heart" size="sm" color="error" variant="solid" />
                <Icon name="star" size="sm" color="warning" variant="solid" />
                <Icon name="check-circle" size="sm" color="success" variant="solid" />
                <StatusIcon status="info" />
              </div>
            </div>

            {/* Animations Demo */}
            <div>
              <p className="text-body-small font-medium mb-2">Animations</p>
              <div className="flex space-x-2">
                <EnhancedAnimatedElement type="bounce" repeat={true}>
                  <div className="w-3 h-3 bg-primary-500 rounded-full" />
                </EnhancedAnimatedElement>
                <EnhancedAnimatedElement type="pulse" repeat={true}>
                  <div className="w-3 h-3 bg-secondary-500 rounded-full" />
                </EnhancedAnimatedElement>
                <EnhancedAnimatedElement type="heartbeat" repeat={true}>
                  <div className="w-3 h-3 bg-error-500 rounded-full" />
                </EnhancedAnimatedElement>
              </div>
            </div>

            {/* Typography Demo */}
            <div>
              <p className="text-body-small font-medium mb-2">Typography</p>
              <div className="space-y-1">
                <div className="heading-6">Heading 6</div>
                <div className="text-body-small">Body text</div>
                <div className="text-caption text-secondary">Caption</div>
              </div>
            </div>

            {/* Interactive Elements */}
            <div>
              <p className="text-body-small font-medium mb-2">Interactive</p>
              <div className="flex items-center space-x-2">
                <IconButton name="heart" aria-label="Like" onClick={() => {}} size="sm" />
                <IconButton name="bookmark" aria-label="Bookmark" onClick={() => {}} size="sm" />
                <IconButton name="share" aria-label="Share" onClick={() => {}} size="sm" />
              </div>
            </div>

            {/* Call to Action */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <IconWithText name="arrow-right" iconPosition="right">
                <Link 
                  href="/brand-showcase" 
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors"
                  onClick={() => setShowDemo(false)}
                >
                  Explore Full Showcase
                </Link>
              </IconWithText>
            </div>
          </div>
        </div>
      </EnhancedAnimatedElement>
    </div>
  );
};

export default DesignSystemDemo; 