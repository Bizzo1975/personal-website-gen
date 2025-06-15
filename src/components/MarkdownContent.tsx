'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const loadMDXRemote = async () => {
      try {
        const { MDXRemote: MDXRemoteComponent } = await import('next-mdx-remote');
        setMDXRemote(() => MDXRemoteComponent);
      } catch (error) {
        console.warn('Failed to load MDXRemote:', error);
      }
    };

    loadMDXRemote();
  }, []);

  // Always render content immediately - no loading states
  if (!content) {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none !mt-0">
        <div>
          <h1>Welcome to My Portfolio</h1>
          <p>I'm a full-stack developer specializing in modern web technologies. This site showcases my projects, skills, and experience.</p>
          <h2>What I Do</h2>
          <p>I build responsive, accessible, and performant web applications using React, Next.js, and other modern frameworks.</p>
          <h2>Let's Connect</h2>
          <p>Feel free to explore my projects and blog posts, or get in touch via the contact page.</p>
        </div>
      </div>
    );
  }

  // If MDXRemote is available, use it; otherwise render fallback content
  if (MDXRemote) {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none !mt-0">
        <MDXRemote {...content} components={components} />
      </div>
    );
  }
  
  // Fallback content while MDXRemote loads
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none !mt-0">
      <div>
        <h1>Welcome to My Portfolio</h1>
        <p>I'm a full-stack developer specializing in modern web technologies. This site showcases my projects, skills, and experience.</p>
        <h2>What I Do</h2>
        <p>I build responsive, accessible, and performant web applications using React, Next.js, and other modern frameworks.</p>
        <h2>Let's Connect</h2>
        <p>Feel free to explore my projects and blog posts, or get in touch via the contact page.</p>
      </div>
    </div>
  );
}
