'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { 
  CalendarIcon, 
  ClockIcon, 
  EyeIcon, 
  ChatBubbleLeftIcon,
  StarIcon as StarOutlineIcon 
} from '@heroicons/react/24/outline';
import { 
  HeartIcon, 
  BookmarkIcon,
  StarIcon as StarSolidIcon 
} from '@heroicons/react/24/solid';
import BlogComments from '@/components/BlogComments';
import SocialShare from '@/components/SocialShare';

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

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  readingTime: number;
  featuredImage?: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchPost();
      fetchRelatedPosts();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're in preview mode and URL search params
      const urlParams = new URLSearchParams(window.location.search);
      const isPreview = urlParams.get('preview') === 'true';
      
      // Try to fetch by slug first, then by ID if preview mode
      let response = await fetch(`/api/posts/by-slug/${slug}${isPreview ? '?preview=true' : ''}`);
      
      // If slug fails and we're in preview mode, try by ID
      if (!response.ok && isPreview) {
        response = await fetch(`/api/posts/${slug}${isPreview ? '?preview=true' : ''}`);
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Post not found');
        } else {
          throw new Error('Failed to fetch post');
        }
        return;
      }
      
      const data = await response.json();
      const postData = data.data || data;
      
      setPost({
        id: postData.id,
        title: postData.title,
        slug: postData.slug,
        content: postData.content,
        excerpt: postData.excerpt || '',
        publishedAt: postData.date || postData.createdAt,
        updatedAt: postData.updatedAt,
        author: postData.author || 'Anonymous',
        tags: postData.tags || [],
        readingTime: postData.readTime || postData.read_time || 5,
        featuredImage: postData.featuredImage || postData.featured_image
      });
      
      setLikesCount(89); // Placeholder
    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      // Fetch related posts based on similar tags or recent posts
      const response = await fetch('/api/posts?limit=3');
      if (response.ok) {
        const data = await response.json();
        const posts = data.posts || data;
        
        const relatedPostsData: RelatedPost[] = posts
          .filter((p: any) => p.slug !== slug)
          .slice(0, 3)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt || '',
            publishedAt: p.date || p.createdAt,
            author: {
              id: '1',
              name: p.author || 'Anonymous',
              bio: 'Content creator',
              avatar: '/images/placeholder.jpg',
              role: 'Author',
              socialLinks: {}
            },
            readingTime: p.readTime || p.read_time || 5,
            featuredImage: p.featuredImage || p.featured_image
          }));
        
        setRelatedPosts(relatedPostsData);
      }
    } catch (error) {
      console.error('Failed to fetch related posts:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
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

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {error === 'Post not found' ? 'Post Not Found' : 'Error Loading Post'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error === 'Post not found' 
            ? "The blog post you're looking for doesn't exist or may have been moved." 
            : "Sorry, we couldn't load this blog post. Please try again later."}
        </p>
        <Link href="/blog" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          &larr; Back to all posts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Preview Banner */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true' && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Preview Mode:</strong> You are viewing a preview of this post. This content may not be published yet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Link href="/blog" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6 inline-block">
        &larr; Back to all posts
      </Link>

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
              <span>By {post.author}</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <HeartIcon className={`h-5 w-5 ${isLiked ? 'text-red-500' : ''}`} />
              <span>{likesCount}</span>
            </button>
            
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <BookmarkIcon className={`h-5 w-5 ${isBookmarked ? 'text-yellow-500' : ''}`} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <SocialShare
            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${post.slug}`}
            title={post.title}
            description={post.excerpt}
          />
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <article key={relatedPost.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                {relatedPost.featuredImage && (
                  <div className="aspect-video overflow-hidden">
                    <Image
                      src={relatedPost.featuredImage}
                      alt={relatedPost.title}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Link href={`/blog/${relatedPost.slug}`}>
                      {relatedPost.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDate(relatedPost.publishedAt)}</span>
                    <span>{relatedPost.readingTime} min read</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
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