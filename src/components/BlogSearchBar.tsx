'use client';

import React, { useState, useCallback } from 'react';

interface BlogSearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

/**
 * Client component for blog post searching
 * This is kept as a client component since it needs interactivity
 */
const BlogSearchBar: React.FC<BlogSearchBarProps> = ({ 
  onSearch, 
  initialQuery = '' 
}) => {
  const [query, setQuery] = useState(initialQuery);

  // Debounced search function to minimize re-renders
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  }, [onSearch]);

  // Clear search function
  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="mb-8 relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search blog posts..."
          value={query}
          onChange={handleSearch}
          className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-label="Search blog posts"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Clear search"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClear()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default BlogSearchBar;
