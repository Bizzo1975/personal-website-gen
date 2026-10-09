'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Define the components to be used in MDX
const components = {
  // Custom Link component to use Next.js Link for internal links
  a: ({ href, children, ...props }: any) => {
    if (href?.startsWith('/')) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }
    
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
  // Enhanced image component with regular img tag
  img: ({ src, alt, ...props }: any) => {
    if (!src) return null;
    
    return (
      <img 
        src={src} 
        alt={alt || ''} 
        width="100%"
        height="100%"
        className="w-full h-64 md:h-96 my-8 overflow-hidden rounded-lg transition-transform hover:scale-105 duration-300"
        style={{ objectFit: 'cover' }}
        loading="lazy"
        {...props}
      />
    );
  },
  // Add other custom components as needed
};

interface MarkdownContentProps {
  content: any;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const [MDXRemote, setMDXRemote] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsMounted(true);
    
    const loadMDXRemote = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('MDXRemote loading timed out'));
          }, 5000);
        });
        
        const loadPromise = import('next-mdx-remote').then(module => module.MDXRemote);
        
        const MDXRemoteComponent = await Promise.race([loadPromise, timeoutPromise]);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        setMDXRemote(() => MDXRemoteComponent);
      } catch (error) {
        console.warn('Failed to load MDXRemote:', error);
        setHasError(true);
      }
    };

    loadMDXRemote();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Neutral placeholder for SSR, loading, empty content and MDX failures.
  // It must never contain copy of its own: a template "welcome" block here
  // used to show on the live home and about pages.
  const renderFallbackContent = () => (
    <div className="prose prose-lg dark:prose-invert max-w-none !mt-0" />
  );

  // Always render consistent structure to prevent hydration mismatches
  if (!isMounted) {
    return renderFallbackContent();
  }

  // Show error state with fallback content
  if (hasError) {
    return renderFallbackContent();
  }

  // Show loading state while MDXRemote loads
  if (!MDXRemote) {
    return renderFallbackContent();
  }

  // Handle missing or invalid content
  if (!content) {
    return renderFallbackContent();
  }

  // Render MDX content with error boundary
  try {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none !mt-0">
        <MDXRemote {...content} components={components} />
      </div>
    );
  } catch (error) {
    console.error('Error rendering MDX content:', error);
    return renderFallbackContent();
  }
}
