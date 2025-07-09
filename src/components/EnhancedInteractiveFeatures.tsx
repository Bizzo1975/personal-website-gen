'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useAriaAnnouncements } from '@/components/AccessibilityEnhancements';

// Enhanced Search Component with autocomplete and advanced features
interface EnhancedSearchProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  className?: string;
  showFilters?: boolean;
}

interface SearchFilters {
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  author?: string;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  onSearch,
  placeholder = "Search posts, projects, and more...",
  suggestions = [],
  recentSearches = [],
  className = '',
  showFilters = true
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { announce } = useAriaAnnouncements();

  // Combine suggestions and recent searches
  const allSuggestions = useMemo(() => {
    const filtered = suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase()) && s !== query
    );
    const recent = recentSearches.filter(s => 
      s.toLowerCase().includes(query.toLowerCase()) && s !== query
    );
    return [...new Set([...filtered, ...recent])].slice(0, 8);
  }, [query, suggestions, recentSearches]);

  // Handle search execution
  const handleSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setIsOpen(false);
    
    try {
      await onSearch(searchQuery, filters);
      announce(`Search completed for "${searchQuery}"`);
      
      // Save to recent searches (in real app, save to localStorage)
      console.log('Saving to recent searches:', searchQuery);
    } catch (error) {
      announce('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, onSearch, announce]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          const selectedQuery = allSuggestions[selectedIndex];
          setQuery(selectedQuery);
          handleSearch(selectedQuery);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    setFilters({});
    inputRef.current?.focus();
    announce('Search cleared');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-slate-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600",
            "rounded-lg bg-white dark:bg-slate-800",
            "text-slate-900 dark:text-slate-100",
            "placeholder-slate-500 dark:placeholder-slate-400",
            "focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            "transition-colors duration-200"
          )}
          aria-label="Search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
          aria-describedby="search-description"
        />

        {/* Loading/Clear Button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isSearching ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              aria-label="Clear search"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Description */}
      <div id="search-description" className="sr-only">
        Use arrow keys to navigate suggestions, Enter to search, Escape to close
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && allSuggestions.length > 0 && (
        <div className={cn(
          "absolute top-full mt-1 w-full z-50",
          "bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700",
          "max-h-64 overflow-y-auto"
        )}>
          <ul role="listbox" aria-label="Search suggestions">
            {allSuggestions.map((suggestion, index) => (
              <li key={suggestion} role="option" aria-selected={selectedIndex === index}>
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full px-4 py-3 text-left flex items-center gap-3",
                    "hover:bg-slate-100 dark:hover:bg-slate-700",
                    "focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none",
                    "transition-colors duration-150",
                    selectedIndex === index && "bg-slate-100 dark:bg-slate-700"
                  )}
                >
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-900 dark:text-slate-100">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters Panel Toggle */}
      {showFilters && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm",
              "text-slate-600 dark:text-slate-400",
              "hover:text-slate-900 dark:hover:text-slate-100",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 rounded",
              "transition-colors duration-200"
            )}
            aria-expanded={showFiltersPanel}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            <svg 
              className={cn("h-4 w-4 transition-transform", showFiltersPanel && "rotate-180")} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Active Filters Count */}
          {Object.values(filters).some(v => v) && (
            <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
              {Object.values(filters).filter(v => v).length} active
            </span>
          )}
        </div>
      )}

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className={cn(
          "mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700",
          "space-y-4"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                <option value="blog">Blog Posts</option>
                <option value="projects">Projects</option>
                <option value="tutorials">Tutorials</option>
                <option value="resources">Resources</option>
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Author
              </label>
              <select
                value={filters.author || ''}
                onChange={(e) => handleFilterChange('author', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Authors</option>
                <option value="john-doe">John Doe</option>
                <option value="jane-smith">Jane Smith</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              onClick={() => setFilters({})}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Social Sharing Component
interface EnhancedSocialShareProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  className?: string;
  variant?: 'compact' | 'expanded';
}

export const EnhancedSocialShare: React.FC<EnhancedSocialShareProps> = ({
  url,
  title,
  description,
  hashtags,
  className = '',
  variant = 'compact'
}) => {
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const socialShareOptions = [
    {
      name: 'Facebook',
      icon: 'facebook',
      color: 'bg-blue-600',
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`
    },
    {
      name: 'LinkedIn',
      icon: 'linkedin',
      color: 'bg-blue-700',
      shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    },
    {
      name: 'Reddit',
      icon: 'reddit',
      color: 'bg-orange-600',
      shareUrl: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    }
  ];

  const handleShare = (platform: typeof socialShareOptions[0]) => {
    window.open(
      platform.shareUrl,
      'share',
      'width=600,height=500,resizable=yes,scrollbars=yes'
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Share:</span>
      <div className="flex items-center gap-1">
        {socialShareOptions.map((platform) => (
          <button
            key={platform.name}
            onClick={() => handleShare(platform)}
            className={`w-8 h-8 flex items-center justify-center text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${platform.color}`}
            aria-label={`Share on ${platform.name}`}
            title={`Share on ${platform.name}`}
          >
            {platform.icon}
          </button>
        ))}
        
        <button
          onClick={copyToClipboard}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Copy link"
          title="Copy link"
        >
          {copiedToClipboard ? '✅' : '🔗'}
        </button>
      </div>
    </div>
  );
};

// Enhanced Newsletter Signup
interface EnhancedNewsletterProps {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  className?: string;
  onSubscribe?: (email: string) => Promise<void>;
}

export const EnhancedNewsletter: React.FC<EnhancedNewsletterProps> = ({
  title = "Stay Updated",
  description = "Get the latest updates delivered to your inbox.",
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  className = '',
  onSubscribe
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (onSubscribe) {
        await onSubscribe(email);
      }
      
      setIsSubscribed(true);
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={`text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 ${className}`}>
        <div className="text-green-600 dark:text-green-400 text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
          You're subscribed!
        </h3>
        <p className="text-green-700 dark:text-green-300 text-sm">
          Check your email to confirm your subscription.
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 ${
              error ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? 'email-error' : undefined}
          />
          {error && (
            <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Subscribing...' : buttonText}
        </button>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
};

export default {
  EnhancedSearch,
  EnhancedSocialShare,
  EnhancedNewsletter
}; 
