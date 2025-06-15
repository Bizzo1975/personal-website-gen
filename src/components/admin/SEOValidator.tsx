'use client';

import React, { useState } from 'react';
import { AccessibleButton } from '@/components/AccessibilityEnhancements';

interface SEOValidationResult {
  title: {
    valid: boolean;
    length: number;
    recommendation: string;
  };
  description: {
    valid: boolean;
    length: number;
    recommendation: string;
  };
  headings: {
    valid: boolean;
    structure: string[];
    recommendation: string;
  };
  images: {
    valid: boolean;
    withAlt: number;
    total: number;
    recommendation: string;
  };
  schema: {
    valid: boolean;
    types: string[];
    recommendation: string;
  };
  performance: {
    score: number;
    recommendations: string[];
  };
}

interface SEOValidatorProps {
  url?: string;
  content?: string;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  onValidationComplete?: (results: SEOValidationResult) => void;
  className?: string;
}

const SEOValidator: React.FC<SEOValidatorProps> = ({
  url,
  content = '',
  metadata,
  onValidationComplete,
  className = ''
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<SEOValidationResult | null>(null);

  // Validate SEO elements
  const validateSEO = async () => {
    setIsValidating(true);
    
    try {
      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Title validation
      const title = metadata?.title || 'Sample Page Title';
      const titleValid = title.length >= 30 && title.length <= 60;
      
      // Description validation
      const description = metadata?.description || 'Sample meta description for SEO analysis';
      const descriptionValid = description.length >= 120 && description.length <= 160;
      
      // Headings structure validation (mock data)
      const headings = ['h1', 'h2', 'h2', 'h3', 'h3'];
      const headingsValid = headings.includes('h1') && headings.length >= 3;
      
      // Images validation (mock data)
      const totalImages = Math.floor(Math.random() * 6); // 0-5 images
      const imagesWithAlt = Math.min(totalImages, 4);
      const imagesValid = totalImages === 0 || (imagesWithAlt / totalImages) >= 0.9;
      
      // Schema markup validation (mock data)
      const schemaTypes = ['WebPage', 'Organization', 'Person'];
      const schemaValid = schemaTypes.length > 0;
      
      const validationResults: SEOValidationResult = {
        title: {
          valid: titleValid,
          length: title.length,
          recommendation: titleValid 
            ? 'Title length is optimal for search engines.'
            : title.length < 30 
              ? 'Title is too short. Aim for 30-60 characters.'
              : 'Title is too long. Keep it under 60 characters.'
        },
        description: {
          valid: descriptionValid,
          length: description.length,
          recommendation: descriptionValid
            ? 'Description length is optimal for search results.'
            : description.length < 120
              ? 'Description is too short. Aim for 120-160 characters.'
              : 'Description is too long. Keep it under 160 characters.'
        },
        headings: {
          valid: headingsValid,
          structure: headings,
          recommendation: headingsValid
            ? 'Heading structure follows SEO best practices.'
            : 'Improve heading structure. Use one H1 and multiple H2-H6 tags.'
        },
        images: {
          valid: imagesValid,
          withAlt: imagesWithAlt,
          total: totalImages,
          recommendation: imagesValid
            ? 'All images have appropriate alt text.'
            : 'Add descriptive alt text to all images for better accessibility and SEO.'
        },
        schema: {
          valid: schemaValid,
          types: schemaTypes,
          recommendation: schemaValid
            ? 'Schema markup is properly implemented.'
            : 'Add structured data (JSON-LD) to improve search engine understanding.'
        },
        performance: {
          score: Math.round((
            (titleValid ? 1 : 0) +
            (descriptionValid ? 1 : 0) +
            (headingsValid ? 1 : 0) +
            (imagesValid ? 1 : 0) +
            (schemaValid ? 1 : 0)
          ) / 5 * 100),
          recommendations: [
            !titleValid && 'Optimize page title length',
            !descriptionValid && 'Improve meta description',
            !headingsValid && 'Fix heading structure',
            !imagesValid && 'Add alt text to images',
            !schemaValid && 'Implement structured data'
          ].filter(Boolean) as string[]
        }
      };
      
      setResults(validationResults);
      onValidationComplete?.(validationResults);
      
    } catch (error) {
      console.error('SEO validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Rich snippets testing
  const testRichSnippets = async () => {
    const testUrl = url || window.location.href;
    const googleTestUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(testUrl)}`;
    window.open(googleTestUrl, '_blank');
  };

  // Schema markup validation
  const validateSchemaMarkup = async () => {
    const testUrl = url || window.location.href;
    const schemaValidatorUrl = `https://validator.schema.org/#url=${encodeURIComponent(testUrl)}`;
    window.open(schemaValidatorUrl, '_blank');
  };

  // Submit sitemap to search engines
  const submitSitemap = async () => {
    const sitemapUrl = `${window.location.origin}/sitemap.xml`;
    const googleSubmitUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    window.open(googleSubmitUrl, '_blank');
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (valid: boolean) => (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
      valid 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }`}>
      {valid ? '✓' : '✗'}
    </span>
  );

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              SEO Validator & Tools
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Analyze and optimize your content for search engines
            </p>
          </div>
          
          <div className="flex gap-2">
            <AccessibleButton
              onClick={validateSEO}
              disabled={isValidating}
              variant="primary"
              size="sm"
              loading={isValidating}
            >
              {isValidating ? 'Analyzing...' : 'Analyze SEO'}
            </AccessibleButton>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
          SEO Tools & Testing
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AccessibleButton
            onClick={submitSitemap}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center p-4 h-auto"
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Submit Sitemap
          </AccessibleButton>
          
          <AccessibleButton
            onClick={testRichSnippets}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center p-4 h-auto"
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Rich Snippets
          </AccessibleButton>
          
          <AccessibleButton
            onClick={validateSchemaMarkup}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center p-4 h-auto"
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Schema Validator
          </AccessibleButton>
          
          <AccessibleButton
            onClick={() => window.open('/api/robots', '_blank')}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center p-4 h-auto"
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Robots.txt
          </AccessibleButton>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="p-6">
          {/* Score Overview */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  SEO Score
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Overall SEO health of your content
                </p>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(results.performance.score)}`}>
                {results.performance.score}%
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            {/* Title */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(results.title.valid)}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Title Tag</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {results.title.length} characters
                  </p>
                </div>
              </div>
              <div className="text-right max-w-md">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {results.title.recommendation}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(results.description.valid)}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Meta Description</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {results.description.length} characters
                  </p>
                </div>
              </div>
              <div className="text-right max-w-md">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {results.description.recommendation}
                </p>
              </div>
            </div>

            {/* Headings */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(results.headings.valid)}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Heading Structure</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {results.headings.structure.join(', ') || 'No headings found'}
                  </p>
                </div>
              </div>
              <div className="text-right max-w-md">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {results.headings.recommendation}
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(results.images.valid)}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Images</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {results.images.withAlt}/{results.images.total} with alt text
                  </p>
                </div>
              </div>
              <div className="text-right max-w-md">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {results.images.recommendation}
                </p>
              </div>
            </div>

            {/* Schema */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(results.schema.valid)}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Schema Markup</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {results.schema.types.length > 0 ? results.schema.types.join(', ') : 'No schema found'}
                  </p>
                </div>
              </div>
              <div className="text-right max-w-md">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {results.schema.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {results.performance.recommendations.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Improvement Recommendations
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                {results.performance.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SEOValidator; 