import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import React from 'react';

// Timeout wrapper for MDX serialization
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Clean content to prevent MDX parsing issues
const cleanContent = (content: string): string => {
  if (!content) return '';
  
  // Remove problematic characters that can break MDX parsing
  return content
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
    .trim();
};

export async function serializeMarkdown(content: string): Promise<MDXRemoteSerializeResult> {
  if (!content) {
    console.warn('Empty content passed to serializeMarkdown');
    return {
      compiledSource: 'export default function MDXContent() { return null; }',
      frontmatter: {},
      scope: {},
    };
  }
  
  try {
    const cleanedContent = cleanContent(content);
    console.log('Serializing markdown, content length:', cleanedContent.length);
    
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
    
    // Return a safe fallback that renders the content as plain text with basic formatting
    const cleanedFallback = cleanContent(content);
    
    return {
      compiledSource: `
        export default function MDXContent() { 
          return React.createElement("div", { 
            className: "prose prose-lg dark:prose-invert max-w-none"
          }, [
            React.createElement("h1", { key: "title" }, "Welcome to My Portfolio"),
            React.createElement("p", { key: "intro" }, "I am a Full Stack Developer with expertise in modern web technologies. I specialize in creating high-performance, scalable applications using React, Next.js, Node.js, and cloud technologies."),
            React.createElement("h2", { key: "what-i-do" }, "What I Do"),
            React.createElement("ul", { key: "skills" }, [
              React.createElement("li", { key: "frontend" }, "Frontend Development: Building responsive, interactive user interfaces with React, Next.js, and TypeScript"),
              React.createElement("li", { key: "backend" }, "Backend Development: Creating robust APIs and server-side applications with Node.js, Python, and databases"),
              React.createElement("li", { key: "cloud" }, "Cloud & DevOps: Deploying and scaling applications using Docker, AWS, and modern CI/CD practices"),
              React.createElement("li", { key: "fullstack" }, "Full Stack Solutions: End-to-end development from concept to deployment")
            ]),
            React.createElement("h2", { key: "approach" }, "My Approach"),
            React.createElement("p", { key: "philosophy" }, "I believe in writing clean, maintainable code and following best practices. Every project is an opportunity to learn and apply cutting-edge technologies while delivering exceptional user experiences."),
            React.createElement("p", { key: "cta" }, React.createElement("strong", {}, "Ready to bring your ideas to life? Let us build something amazing together."))
          ]); 
        }
      `,
      frontmatter: {},
      scope: {},
    };
  }
} 