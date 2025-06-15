import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

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
    console.log('Serializing markdown, content length:', content.length);
    const mdxSource = await serialize(content, {
      // Add any serialize options here
      mdxOptions: {
        development: process.env.NODE_ENV === 'development',
      },
    });
    
    return mdxSource;
  } catch (error) {
    console.error('Error serializing markdown:', error);
    console.error('Content that caused the error:', content.substring(0, 100) + '...');
    // Return a minimal valid MDX source in case of error
    return {
      compiledSource: 'export default function MDXContent() { return React.createElement("div", { className: "text-red-500" }, "Error rendering content. Please check console for details."); }',
      frontmatter: {},
      scope: {},
    };
  }
} 