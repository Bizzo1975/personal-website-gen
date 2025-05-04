'use client';

import React from 'react';
import { MDXRemote } from 'next-mdx-remote';
import Link from 'next/link';
import Image from 'next/image';

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
  // Enhanced image component with Next.js Image
  img: ({ src, alt, ...props }: any) => {
    if (!src) return null;
    
    // For external images
    if (src.startsWith('http')) {
      return (
        <div className="relative w-full h-64 md:h-96 my-8 overflow-hidden rounded-lg">
          <Image 
            src={src} 
            alt={alt || ''} 
            fill 
            style={{ objectFit: 'cover' }}
            className="transition-transform hover:scale-105 duration-300"
          />
        </div>
      );
    }
    
    // For local images
    return (
      <div className="relative w-full h-64 md:h-96 my-8 overflow-hidden rounded-lg">
        <img 
          src={src} 
          alt={alt || ''} 
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" 
          {...props}
        />
      </div>
    );
  },
  // Add other custom components as needed
};

interface MarkdownContentProps {
  content: any;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) {
    return <div className="p-4 border border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800 rounded-md">
      No content available
    </div>;
  }
  
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <MDXRemote {...content} components={components} />
    </div>
  );
}
