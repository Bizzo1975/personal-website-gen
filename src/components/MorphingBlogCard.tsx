'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode } from 'react-icons/fi';

interface MorphingBlogCardProps {
  post: {
    id: string;
    title: string;
    date: string;
    excerpt: string;
    tags: string[];
    slug: string;
    featuredImage?: string;
  };
  index: number;
}

const MorphingBlogCard: React.FC<MorphingBlogCardProps> = ({ post, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create a shorter preview for collapsed state
  const shortExcerpt = post.excerpt.length > 150 ? `${post.excerpt.substring(0, 150)}...` : post.excerpt;

  return (
    <motion.article
      className="animate-fade-in-up opacity-0 cursor-pointer relative"
      style={{ 
        animationDelay: `${index * 150}ms`,
        animationFillMode: 'forwards'
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`card-enhanced group transition-all duration-300 ${isExpanded ? 'transform scale-105 shadow-2xl z-50' : ''}`}>
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Hide the image container if the image fails to load
                e.currentTarget.parentElement?.style.setProperty('display', 'none');
              }}
            />
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        )}
        
        <div className="p-6 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-3">
            <time className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(post.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </time>
            <div className="flex gap-1">
              {post.tags.slice(0, 2).map((tag, tagIndex) => (
                <span key={tagIndex} className="px-2 py-1 bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-300 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            {isExpanded ? post.excerpt : shortExcerpt}
          </p>

          {/* Show additional content when expanded */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 overflow-hidden"
              >
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    This comprehensive guide covers the latest best practices, techniques, and insights you need to know.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Estimated reading time: 5 min
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-4">
            <Link 
              href={`/blog/${post.slug}`}
              className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 font-medium text-sm inline-flex items-center transition-colors"
            >
              {isExpanded ? 'Read Full Article' : 'Read More'}
              <motion.div
                animate={{ rotate: isExpanded ? 360 : 0 }}
                transition={{ duration: 0.6 }}
                className="ml-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-full p-1"
              >
                <FiCode className="h-3 w-3 text-secondary-600 dark:text-secondary-400" />
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default MorphingBlogCard; 