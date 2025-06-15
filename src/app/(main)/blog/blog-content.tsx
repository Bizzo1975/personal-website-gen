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

  // Default blog posts with our UI-specific fields
  const defaultPosts: ExtendedPost[] = [
    {
      id: '1',
      title: 'Building Modern Web Applications with Next.js 14 and TypeScript',
      slug: 'building-modern-web-apps-nextjs-14-typescript',
      excerpt: 'Discover the powerful features of Next.js 14 and learn how to build modern, performant web applications with TypeScript. From Turbopack to Server Actions, explore the latest innovations.',
      date: '2024-01-15',
      content: '',
      readTime: 8,
      tags: ['Next.js', 'TypeScript', 'React', 'Web Development'],
      category: 'Frontend Development',
      views: 1247,
      author: {
        name: 'Alex Johnson',
        image: '/images/authors/alex-johnson.jpg'
      },
      coverImage: '/images/blog/nextjs-14-typescript.jpg',
      featuredImage: '/images/blog/nextjs-14-typescript.jpg',
      published: true,
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Advanced TypeScript Patterns for React Developers',
      slug: 'advanced-typescript-patterns-react',
      excerpt: 'Learn advanced TypeScript patterns that will make your React code more robust and maintainable. Explore utility types, conditional types, and more.',
      date: '2024-01-10',
      content: '',
      readTime: 6,
      tags: ['TypeScript', 'React', 'Patterns', 'Best Practices'],
      category: 'Frontend Development',
      views: 892,
      author: {
        name: 'Sarah Chen',
        image: '/images/authors/sarah-chen.jpg'
      },
      coverImage: '/images/blog/typescript-patterns.jpg',
      featuredImage: '/images/blog/typescript-patterns.jpg',
      published: true,
      updatedAt: new Date('2024-01-10')
    },
    {
      id: '3',
      title: 'Optimizing React Performance in 2024',
      slug: 'optimizing-react-performance-2024',
      excerpt: 'Discover the latest techniques and tools for optimizing React application performance. From React 18 features to advanced optimization strategies.',
      date: '2024-01-08',
      content: '',
      readTime: 10,
      tags: ['React', 'Performance', 'Optimization', 'JavaScript'],
      category: 'Performance',
      views: 1456,
      author: {
        name: 'Alex Johnson',
        image: '/images/authors/alex-johnson.jpg'
      },
      coverImage: '/images/blog/react-performance.jpg',
      featuredImage: '/images/blog/react-performance.jpg',
      published: true,
      updatedAt: new Date('2024-01-08')
    },
    {
      id: '4',
      title: 'Building Scalable APIs with Next.js App Router',
      slug: 'scalable-apis-nextjs-app-router',
      excerpt: 'Learn how to build robust and scalable APIs using Next.js 14 App Router and best practices for API design and implementation.',
      date: '2024-01-05',
      content: '',
      readTime: 7,
      tags: ['Next.js', 'API', 'Backend', 'Scalability'],
      category: 'Backend Development',
      views: 734,
      author: {
        name: 'Mike Rodriguez',
        image: '/images/authors/mike-rodriguez.jpg'
      },
      coverImage: '/images/blog/nextjs-apis.jpg',
      featuredImage: '/images/blog/nextjs-apis.jpg',
      published: true,
      updatedAt: new Date('2024-01-05')
    },
    {
      id: '5',
      title: 'Modern CSS Techniques: Grid, Flexbox, and Container Queries',
      slug: 'modern-css-techniques-2024',
      excerpt: 'Explore the latest CSS features and techniques including CSS Grid, Flexbox, Container Queries, and modern layout patterns.',
      date: '2024-01-03',
      content: '',
      readTime: 5,
      tags: ['CSS', 'Grid', 'Flexbox', 'Layout'],
      category: 'Frontend Development',
      views: 623,
      author: {
        name: 'Emma Wilson',
        image: '/images/authors/emma-wilson.jpg'
      },
      coverImage: '/images/blog/modern-css.jpg',
      featuredImage: '/images/blog/modern-css.jpg',
      published: true,
      updatedAt: new Date('2024-01-03')
    },
    {
      id: '6',
      title: 'Database Design Patterns for Modern Applications',
      slug: 'database-design-patterns-modern-apps',
      excerpt: 'Learn essential database design patterns and best practices for building scalable and maintainable modern applications.',
      date: '2023-12-28',
      content: '',
      readTime: 9,
      tags: ['Database', 'Design Patterns', 'Architecture', 'SQL'],
      category: 'Backend Development',
      views: 445,
      author: {
        name: 'David Kim',
        image: '/images/authors/david-kim.jpg'
      },
      coverImage: '/images/blog/database-patterns.jpg',
      featuredImage: '/images/blog/database-patterns.jpg',
      published: true,
      updatedAt: new Date('2023-12-28')
    }
  ];

  // Use provided posts or default to our samples
  const displayedPosts = posts.length > 0 
    ? posts.map(post => {
        const imageUrl = (post as any).featuredImage || `/images/slideshow/coding-${Math.floor(Math.random() * 5) + 1}.jpg`;
        
        return {
          ...post,
          coverImage: imageUrl,
          featuredImage: imageUrl,
          category: (post as any).category || 'General',
          views: (post as any).views || Math.floor(Math.random() * 1000) + 100,
          author: typeof post.author === 'string' 
            ? { name: post.author, image: '/images/placeholder.jpg' }
            : post.author
        };
      })
    : defaultPosts;

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
    <div className="space-y-6">
      {/* Header Section */}
      <HeaderSection 
        title={pageData?.headerTitle || "Blog & Articles"}
        subtitle={pageData?.headerSubtitle || "Thoughts, tutorials, and insights on web development, design, and technology."}
        showSlideshow={true}
        className="bg-gradient-secondary"
        compact={true}
      />
      
      {/* Enhanced Search Section */}
      <section className="section-modern">
        <div className="container-modern">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
            <EnhancedSearch
              onSearch={handleEnhancedSearch}
              placeholder="Search blog posts, tags, and categories..."
              suggestions={searchSuggestions}
              recentSearches={[]} // In real app, load from localStorage
              showFilters={true}
              className="mb-4"
            />
            
            {/* Legacy Filter Controls - Keep for additional filtering */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Category Filter */}
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none"
                >
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>
                      {tag === 'all' ? 'All Tags' : tag}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none"
                >
                  <option value="date">Sort by Date</option>
                  <option value="views">Sort by Views</option>
                  <option value="readTime">Sort by Read Time</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedPosts.length} of {displayedPosts.length} posts
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
                        <span>{formatDate(post.date)}</span>
                        <span>{post.readTime} min read</span>
                        {post.views && <span>{post.views} views</span>}
                      </div>
                    </div>
                    
                    {/* Author */}
                    {post.author && (
                      <div className="flex items-center mb-4">
                        <img
                          src={typeof post.author === 'string' ? '/images/placeholder.jpg' : post.author.image}
                          alt={typeof post.author === 'string' ? post.author : post.author.name}
                          className="w-8 h-8 rounded-full mr-3"
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

      {/* Newsletter Signup Section */}
      <section className="section-modern">
        <div className="container-modern">
          <NewsletterSignup
            variant="inline"
            title="Stay Updated with Latest Posts"
            description="Get notified when I publish new articles and tutorials on web development, design, and technology."
            incentive="✨ Plus exclusive tips and early access to new content"
            showSocialProof={true}
            subscriberCount={2847}
          />
        </div>
      </section>
    </div>
  );
} 