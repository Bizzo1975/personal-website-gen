import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import React from 'react';

// Timeout wrapper for MDX serialization
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Convert HTML to Markdown-friendly content
const convertHtmlToMarkdown = (content: string): string => {
  if (!content) return '';
  
  return content
    // Convert paragraph tags to markdown
    .replace(/<p>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
    // Convert bold and italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Convert links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Convert lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Convert code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```')
    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Clean content to prevent MDX parsing issues
const cleanContent = (content: string): string => {
  if (!content) return '';
  
  // First convert HTML to markdown if needed
  let cleaned = content.includes('<') ? convertHtmlToMarkdown(content) : content;
  
  // Remove problematic characters that can break MDX parsing
  cleaned = cleaned
    .replace(/\\n/g, '\n')    // Convert literal \n to actual newlines
    .replace(/\\r/g, '\r')    // Convert literal \r to actual carriage returns
    .replace(/\r\n/g, '\n')   // Normalize line endings
    .replace(/\r/g, '\n')     // Convert remaining CR to LF
    .replace(/&amp;/g, '&')   // Convert HTML entities to actual characters
    .replace(/&lt;/g, '<')    // Convert HTML entities
    .replace(/&gt;/g, '>')    // Convert HTML entities
    .replace(/&quot;/g, '"')  // Convert HTML entities
    .replace(/&#39;/g, "'")   // Convert HTML entities
    .replace(/\u0000/g, '')   // Remove null bytes
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    // Remove any export statements that might be causing issues
    .replace(/export\s+default\s+/gi, '')
    .replace(/export\s+/gi, '')
    .replace(/import\s+.*?from\s+['"][^'"]*['"];?/gi, '')
    .trim();
  
  return cleaned;
};

export async function serializeMarkdown(content: string): Promise<MDXRemoteSerializeResult> {
  if (!content) {
    console.warn('Empty content passed to serializeMarkdown');
    return {
      compiledSource: 'export default function MDXContent() { return React.createElement("div", { className: "prose prose-lg dark:prose-invert max-w-none" }, React.createElement("p", {}, "Content coming soon...")); }',
      frontmatter: {},
      scope: {},
    };
  }
  
  try {
    const cleanedContent = cleanContent(content);
    console.log('Serializing markdown, content length:', cleanedContent.length);
    console.log('First 200 chars:', cleanedContent.substring(0, 200));
    
    // Add timeout to prevent hanging
    const mdxSource = await withTimeout(
      serialize(cleanedContent, {
        mdxOptions: {
          development: process.env.NODE_ENV === 'development',
          format: 'mdx',
        },
        parseFrontmatter: true,
      }),
      10000 // 10 second timeout
    );
    
    console.log('MDX serialization completed successfully');
    return mdxSource;
  } catch (error) {
    console.error('Error serializing markdown:', error);
    console.error('Content that caused the error:', content.substring(0, 200) + '...');
    
    // Return a safe fallback that renders the cleaned content as paragraphs
    const cleanedFallback = cleanContent(content);
    const paragraphs = cleanedFallback.split('\n\n').filter(p => p.trim());
    
    return {
      compiledSource: `
        export default function MDXContent() { 
          const paragraphs = ${JSON.stringify(paragraphs)};
          return React.createElement("div", { 
            className: "prose prose-lg dark:prose-invert max-w-none"
          }, paragraphs.map((text, index) => 
            React.createElement("p", { key: index }, text)
          )); 
        }
      `,
      frontmatter: {},
      scope: {},
    };
  }
} 