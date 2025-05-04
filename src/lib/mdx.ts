import { serialize } from 'next-mdx-remote/serialize';

export async function serializeMarkdown(content: string) {
  try {
    const mdxSource = await serialize(content, {
      // Add any serialize options here
      mdxOptions: {
        development: process.env.NODE_ENV === 'development',
      },
    });
    
    return mdxSource;
  } catch (error) {
    console.error('Error serializing markdown:', error);
    // Return a minimal valid MDX source in case of error
    return {
      compiledSource: 'export default function MDXContent() { return "Error rendering content"; }',
      frontmatter: {},
    };
  }
} 