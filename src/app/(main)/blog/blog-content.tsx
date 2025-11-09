'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { PostData } from '@/lib/services/post-service';
import { PageData } from '@/lib/services/page-service';
import HeaderSection from '@/components/HeaderSection';
import FallbackImage from '@/components/FallbackImage';
import { 
  ClockIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { EnhancedSearch, EnhancedSocialShare, EnhancedNewsletter } from '@/components/EnhancedInteractiveFeatures';
import SocialShare from '@/components/SocialShare';
import NewsletterSignup from '@/components/NewsletterSignup';

// Extended post type to include the fields needed for our UI
interface ExtendedPost extends Omit<PostData, 'author'> {
  coverImage?: string;
  featuredImage?: string;
  category?: string;
  views?: number;
  author: {
    name: string;
    image: string;
  } | string;
}

interface BlogContentProps {
  posts: PostData[];
  pageData?: PageData | null;
}

export default function BlogContent({ posts = [], pageData }: BlogContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Use only the database posts - no mock data fallback
  const displayedPosts = posts.map((post, index) => {
    const imageUrl = post.featuredImage || `/images/placeholder.jpg`;
    console.log('Post image URL:', imageUrl, 'for post:', post.title);
    
    return {
      ...post,
      coverImage: imageUrl,
      featuredImage: imageUrl,
      category: 'General', // Default category since we don't have categories in the database yet
      views: 100 + (index * 50), // Fixed deterministic view count to prevent hydration errors
      author: typeof post.author === 'string' 
        ? { name: post.author, image: '/images/placeholder.jpg' }
        : post.author,
      // Add featured property from post
      featured: post.featured || false
    };
  });

  // Separate featured and regular posts
  const featuredPosts = displayedPosts.filter(post => post.featured);
  const regularPosts = displayedPosts.filter(post => !post.featured);

  // Get unique categories and tags
  const categories = useMemo(() => {
    const uniqueCategories = displayedPosts.map(post => post.category).filter(Boolean);
    const cats = ['all', ...Array.from(new Set(uniqueCategories))];
    return cats;
  }, [displayedPosts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    displayedPosts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tags.add(tag));
      }
    });
    return ['all', ...Array.from(tags)];
  }, [displayedPosts]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = displayedPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      
      const matchesTag = selectedTag === 'all' || (post.tags && post.tags.includes(selectedTag));
      
      return matchesSearch && matchesCategory && matchesTag;
    });

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'readTime':
          return (a.readTime || 0) - (b.readTime || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [displayedPosts, searchTerm, selectedCategory, selectedTag, sortBy]);
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle enhanced search
  const handleEnhancedSearch = useCallback((query: string, filters?: any) => {
    setSearchTerm(query);
    if (filters?.category) {
      setSelectedCategory(filters.category);
    }
    // Additional filter handling can be added here
  }, []);

  // Get search suggestions from existing posts
  const searchSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    displayedPosts.forEach(post => {
      // Add post titles
      suggestions.add(post.title);
      // Add tags
      if (post.tags) {
        post.tags.forEach(tag => suggestions.add(tag));
      }
      // Add categories
      if (post.category) {
        suggestions.add(post.category);
      }
    });
    return Array.from(suggestions).slice(0, 20);
  }, [displayedPosts]);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <HeaderSection 
        title={pageData?.headerTitle || "Blog & Articles"}
        subtitle={pageData?.headerSubtitle || "Thoughts, tutorials, and insights on web development, design, and technology."}
        showSlideshow={true}
        className="bg-gradient-secondary"
        compact={true}
      />

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="py-6 md:py-8">
          <div className="container-modern">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Featured Articles
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Handpicked articles covering the latest trends and insights
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.slice(0, 3).map((post) => (
                <article 
                  key={post.id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Featured
                      </span>
                    </div>
                    <FallbackImage
                      src={post.coverImage}
                      alt={post.title}
                      width={400}
                      height={240}
                      className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(typeof post.date === 'string' ? post.date : post.date instanceof Date ? post.date.toISOString() : String(post.date))}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{post.readTime} min read</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Read More
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Enhanced Search Section */}
      <section className="py-6 md:py-8">
        <div className="container-modern">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
            {/* All Controls on Single Line */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-shrink-0 flex-1 min-w-[200px]">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              {/* Category Filter */}
              <div className="relative flex-shrink-0">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-8 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none min-w-[140px]"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              <div className="relative flex-shrink-0">
                <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="pl-8 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none min-w-[120px]"
                >
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>
                      {tag === 'all' ? 'All Tags' : tag}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="relative flex-shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none min-w-[140px]"
                >
                  <option value="date">Sort by Date</option>
                  <option value="views">Sort by Views</option>
                  <option value="readTime">Sort by Read Time</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedTag('all');
                  setSortBy('date');
                }}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Blog Posts Grid */}
          {filteredAndSortedPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <MagnifyingGlassIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No posts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search terms or filters.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedTag('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedPosts.map((post, index) => (
                <article key={post.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200">
                  {/* Featured Image */}
                  {post.coverImage && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.error('Image failed to load:', post.coverImage);
                          e.currentTarget.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Category Badge */}
                    {post.category && (
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full mb-3">
                        {post.category}
                      </span>
                    )}
                    
                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <a href={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </a>
                    </h2>
                    
                    {/* Excerpt */}
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    {/* Meta Information */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-4">
                        <span>{formatDate(typeof post.date === 'string' ? post.date : post.date.toISOString())}</span>
                        <span>{post.readTime} min read</span>
                        {post.views && <span>{post.views} views</span>}
                      </div>
                    </div>
                    
                    {/* Author */}
                    {post.author && (
                      <div className="flex items-center mb-4">
                        <FallbackImage
                          src={typeof post.author === 'string' ? '/images/placeholder.jpg' : post.author.image}
                          alt={typeof post.author === 'string' ? post.author : post.author.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full mr-3"
                          fallbackSrc="/images/placeholder.jpg"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {typeof post.author === 'string' ? post.author : post.author.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                            +{post.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Social Share */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={`/blog/${post.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors"
                      >
                        Read More →
                      </a>
                      
                      <SocialShare
                        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${post.slug}`}
                        title={post.title}
                        description={post.excerpt}
                        size="sm"
                        variant="icons"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-6 md:py-8 bg-primary-50 dark:bg-primary-900/10">
        <div className="container-modern">
          <NewsletterSignup
            variant="compact"
            title="Stay in the Loop"
            description="Get notified about new projects, blog posts, and insights on my latest learnings."
            showSocialProof={true}
          />
        </div>
      </section>
    </div>
  );
} 