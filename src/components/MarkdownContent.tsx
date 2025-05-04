'use client';

import React from 'react';
import { MDXRemote } from 'next-mdx-remote';
import Link from 'next/link';
import CodeBlock from './CodeBlock';

// Define the components to be used in MDX
const components = {
  code: CodeBlock,
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
};

interface MarkdownContentProps {
  content: any;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <MDXRemote {...content} components={components} />
    </div>
  );
} 