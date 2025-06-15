'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BlogComments from '@/components/BlogComments';
import { 
  ClockIcon, 
  UserIcon, 
  CalendarIcon, 
  TagIcon,
  ShareIcon,
  BookmarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface Author {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  role: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  author: Author;
  tags: string[];
  category: string;
  readingTime: number;
  views: number;
  likes: number;
  comments: number;
  series?: {
    name: string;
    part: number;
    totalParts: number;
  };
  featuredImage?: string;
  isBookmarked: boolean;
  isLiked: boolean;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  author: Author;
  readingTime: number;
  featuredImage?: string;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchPost();
    fetchRelatedPosts();
  }, [params.slug]);

  const fetchPost = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockPost: BlogPost = {
        id: '1',
        title: 'Building Modern Web Applications with Next.js 14 and TypeScript',
        slug: params.slug,
        content: `
          <p>
            Next.js 14 has revolutionized the way we build React applications by providing a comprehensive framework that handles many of the complexities of modern web development. Combined with TypeScript, it offers an unparalleled development experience.
          </p>
          
          <h2>What's New in Next.js 14</h2>
          
          <p>
            The latest version of Next.js introduces several groundbreaking features that make development faster and more efficient:
          </p>
          
          <ul>
            <li><strong>Turbopack</strong>: The new Rust-based bundler that's 700x faster than Webpack</li>
            <li><strong>Server Actions</strong>: Simplified server-side mutations without API routes</li>
            <li><strong>Partial Prerendering</strong>: Combine static and dynamic content seamlessly</li>
            <li><strong>Enhanced App Router</strong>: Improved routing with better performance</li>
          </ul>
          
          <h2>Setting Up Your Development Environment</h2>
          
          <p>
            Getting started with Next.js 14 and TypeScript is straightforward. Here's how to create a new project:
          </p>
          
          <pre><code>npx create-next-app@latest my-app --typescript --tailwind --eslint --app</code></pre>
          
          <p>
            This command sets up a new project with TypeScript, Tailwind CSS, ESLint, and the new App Router.
          </p>
          
          <h2>Key Architecture Patterns</h2>
          
          <p>
            When building with Next.js 14, consider these architectural patterns:
          </p>
          
          <h3>1. Server Components by Default</h3>
          <p>
            Next.js 14 uses Server Components by default, which means your components run on the server and send HTML to the client. This improves performance and SEO.
          </p>
          
          <h3>2. Strategic Client Components</h3>
          <p>
            Use the "use client" directive only when you need interactivity, state, or browser APIs.
          </p>
          
          <h3>3. Data Fetching Strategies</h3>
          <p>
            Leverage the new fetch API with built-in caching and revalidation strategies.
          </p>
          
          <h2>Performance Optimization Techniques</h2>
          
          <p>
            Here are some advanced techniques to optimize your Next.js 14 application:
          </p>
          
          <ul>
            <li><strong>Image Optimization</strong>: Use next/image for automatic optimization</li>
            <li><strong>Font Optimization</strong>: Leverage next/font for better font loading</li>
            <li><strong>Bundle Analysis</strong>: Use @next/bundle-analyzer to identify bottlenecks</li>
            <li><strong>Streaming</strong>: Implement streaming for better perceived performance</li>
          </ul>
          
          <h2>TypeScript Best Practices</h2>
          
          <p>
            When working with TypeScript in Next.js 14, follow these best practices:
          </p>
          
          <pre><code>// Define strict types for your components
interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  // Your component logic
}</code></pre>
          
          <h2>Deployment and Production Considerations</h2>
          
          <p>
            When deploying your Next.js 14 application, consider these factors:
          </p>
          
          <ul>
            <li><strong>Vercel Integration</strong>: Seamless deployment with zero configuration</li>
            <li><strong>Edge Runtime</strong>: Use edge functions for global performance</li>
            <li><strong>Analytics</strong>: Implement Next.js Analytics for performance insights</li>
            <li><strong>Monitoring</strong>: Set up error tracking and performance monitoring</li>
          </ul>
          
          <h2>Conclusion</h2>
          
          <p>
            Next.js 14 with TypeScript represents the cutting edge of React development. By leveraging its powerful features and following best practices, you can build applications that are not only performant but also maintainable and scalable.
          </p>
          
          <p>
            The combination of Server Components, improved routing, and TypeScript's type safety creates a development experience that's both productive and enjoyable. As the ecosystem continues to evolve, Next.js 14 positions your applications for future success.
          </p>
        `,
        excerpt: 'Discover the powerful features of Next.js 14 and learn how to build modern, performant web applications with TypeScript. From Turbopack to Server Actions, explore the latest innovations.',
        publishedAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T14:30:00Z',
        author: {
          id: '1',
          name: 'Alex Johnson',
          bio: 'Senior Full-Stack Developer with 8+ years of experience in React, Next.js, and TypeScript. Passionate about building scalable web applications and sharing knowledge with the developer community.',
          avatar: '/images/authors/alex-johnson.jpg',
          role: 'Senior Developer',
          socialLinks: {
            twitter: 'https://twitter.com/alexjohnson',
            linkedin: 'https://linkedin.com/in/alexjohnson',
            github: 'https://github.com/alexjohnson'
          }
        },
        tags: ['Next.js', 'TypeScript', 'React', 'Web Development', 'Performance'],
        category: 'Frontend Development',
        readingTime: 8,
        views: 1247,
        likes: 89,
        comments: 23,
        series: {
          name: 'Modern React Development',
          part: 1,
          totalParts: 5
        },
        featuredImage: '/images/blog/nextjs-14-typescript.jpg',
        isBookmarked: false,
        isLiked: false
      };

      setPost(mockPost);
      setIsBookmarked(mockPost.isBookmarked);
      setIsLiked(mockPost.isLiked);
      setLikesCount(mockPost.likes);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      // Mock related posts data
      const mockRelatedPosts: RelatedPost[] = [
        {
          id: '2',
          title: 'Advanced TypeScript Patterns for React Developers',
          slug: 'advanced-typescript-patterns-react',
          excerpt: 'Learn advanced TypeScript patterns that will make your React code more robust and maintainable.',
          publishedAt: '2024-01-10T10:00:00Z',
          author: {
            id: '2',
            name: 'Sarah Chen',
            bio: 'TypeScript expert and React consultant',
            avatar: '/images/authors/sarah-chen.jpg',
            role: 'TypeScript Consultant',
            socialLinks: {}
          },
          readingTime: 6,
          featuredImage: '/images/blog/typescript-patterns.jpg'
        },
        {
          id: '3',
          title: 'Optimizing React Performance in 2024',
          slug: 'optimizing-react-performance-2024',
          excerpt: 'Discover the latest techniques and tools for optimizing React application performance.',
          publishedAt: '2024-01-08T10:00:00Z',
          author: {
            id: '1',
            name: 'Alex Johnson',
            bio: 'Senior Full-Stack Developer',
            avatar: '/images/authors/alex-johnson.jpg',
            role: 'Senior Developer',
            socialLinks: {}
          },
          readingTime: 10,
          featuredImage: '/images/blog/react-performance.jpg'
        },
        {
          id: '4',
          title: 'Building Scalable APIs with Next.js App Router',
          slug: 'scalable-apis-nextjs-app-router',
          excerpt: 'Learn how to build robust and scalable APIs using Next.js 14 App Router and best practices.',
          publishedAt: '2024-01-05T10:00:00Z',
          author: {
            id: '3',
            name: 'Mike Rodriguez',
            bio: 'Backend architect and API specialist',
            avatar: '/images/authors/mike-rodriguez.jpg',
            role: 'Backend Architect',
            socialLinks: {}
          },
          readingTime: 7,
          featuredImage: '/images/blog/nextjs-apis.jpg'
        }
      ];

      setRelatedPosts(mockRelatedPosts);
    } catch (error) {
      console.error('Failed to fetch related posts:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      // In real app, make API call
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to bookmark post:', error);
    }
  };

  const handleLike = async () => {
    try {
      // In real app, make API call
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('URL copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 h-8 w-32 mb-6 rounded"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-12 w-3/4 mb-4 rounded"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-6 w-1/2 mb-8 rounded"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-64 w-full mb-8 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-4 w-full rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The blog post you're looking for doesn't exist.
        </p>
        <Link href="/blog" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          &larr; Back to all posts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Navigation */}
      <Link href="/blog" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6 inline-block">
        &larr; Back to all posts
      </Link>

      {/* Series Navigation */}
      {post.series && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                {post.series.name}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Part {post.series.part} of {post.series.totalParts}
              </p>
            </div>
            <div className="flex space-x-2">
              {post.series.part > 1 && (
                <Link href="#" className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                  Previous
                </Link>
              )}
              {post.series.part < post.series.totalParts && (
                <Link href="#" className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      <article>
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {post.title}
          </h1>
          
          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{post.readingTime} min read</span>
            </div>
            <div className="flex items-center">
              <EyeIcon className="h-4 w-4 mr-1" />
              <span>{post.views.toLocaleString()} views</span>
            </div>
            <div className="flex items-center">
              <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
              <span>{post.comments} comments</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tags/${tag.toLowerCase()}`}
                className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {isLiked ? (
                <HeartSolidIcon className="h-5 w-5" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              <span>{likesCount}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {isBookmarked ? (
                <BookmarkSolidIcon className="h-5 w-5" />
              ) : (
                <BookmarkIcon className="h-5 w-5" />
              )}
              <span>Bookmark</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ShareIcon className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div 
          className="prose dark:prose-invert max-w-none prose-headings:text-black dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-code:text-blue-600 dark:prose-code:text-blue-400"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Updated Date */}
        {post.updatedAt && post.updatedAt !== post.publishedAt && (
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {formatDate(post.updatedAt)}
            </p>
          </div>
        )}
      </article>

      {/* Author Bio */}
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-start space-x-4">
          <Image
            src={post.author.avatar}
            alt={post.author.name}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {post.author.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {post.author.role}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {post.author.bio}
            </p>
            <div className="flex space-x-3">
              {post.author.socialLinks.twitter && (
                <a
                  href={post.author.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  Twitter
                </a>
              )}
              {post.author.socialLinks.linkedin && (
                <a
                  href={post.author.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  LinkedIn
                </a>
              )}
              {post.author.socialLinks.github && (
                <a
                  href={post.author.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Related Posts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                href={`/blog/${relatedPost.slug}`}
                className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {relatedPost.featuredImage && (
                  <Image
                    src={relatedPost.featuredImage}
                    alt={relatedPost.title}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{relatedPost.author.name}</span>
                    <div className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span>{relatedPost.readingTime} min</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="mt-12">
        <BlogComments
          postId={post.id}
          postTitle={post.title}
          allowAnonymous={true}
          moderationEnabled={true}
          maxDepth={3}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        />
      </div>
    </div>
  );
} 