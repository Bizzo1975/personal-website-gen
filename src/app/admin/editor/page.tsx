'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedEditor from '@/components/admin/EnhancedEditor';

/**
 * Sample Admin Editor Page
 * Demonstrates how to use the EnhancedEditor component with different configurations
 */
const AdminEditorPage = () => {
  const router = useRouter();
  const [content, setContent] = useState('<h2>Welcome to the Enhanced Editor!</h2><p>This is a sample text. Try formatting it using the toolbar above.</p>');
  const [minimalContent, setMinimalContent] = useState('<p>This editor has minimal toolbar options.</p>');
  const [previewMode, setPreviewMode] = useState(false);
  const [showSource, setShowSource] = useState(false);
  
  // Early return for loading state if needed
  if (!router) return null;

  // Handle image upload
  const handleImageUpload = async (file: File): Promise<string> => {
    // In a real app, you would upload the file to your server or a cloud service
    // and return the URL of the uploaded image
    
    // For this demo, we'll just create a local object URL
    // Note: In production, you should use a proper upload service
    return new Promise((resolve) => {
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        resolve(url);
      }, 1000); // Simulate network delay
    });
  };

  // Toggle between edit and preview modes
  const handleTogglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Toggle source code view
  const handleToggleSource = () => {
    setShowSource(!showSource);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Content Editor</h1>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Full-Featured Editor</h2>
          <div className="space-x-2">
            <button
              type="button"
              onClick={handleTogglePreview}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label={previewMode ? "Switch to edit mode" : "Switch to preview mode"}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTogglePreview()}
            >
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={handleToggleSource}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label={showSource ? "Hide HTML source" : "View HTML source"}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleToggleSource()}
            >
              {showSource ? 'Hide HTML' : 'View HTML'}
            </button>
          </div>
        </div>
        
        {previewMode ? (
          <div 
            className="prose dark:prose-invert max-w-none p-6 border rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            dangerouslySetInnerHTML={{ __html: content }}
            aria-label="Content preview"
          />
        ) : (
          <EnhancedEditor
            value={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
            height="300px"
            placeholder="Write your content here..."
            className="mb-4"
            id="full-editor"
            ariaLabel="Full-featured rich text editor"
          />
        )}
        
        {showSource && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">HTML Source</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
              <code className="text-sm">{content}</code>
            </pre>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Editor */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Basic Editor</h2>
          <EnhancedEditor
            value={minimalContent}
            onChange={setMinimalContent}
            toolbar="basic"
            height="200px"
            className="mb-4"
            id="basic-editor"
            ariaLabel="Basic rich text editor"
          />
        </div>
        
        {/* Read-only Editor */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Read-only View</h2>
          <EnhancedEditor
            value={content}
            onChange={() => {}} // No-op for readonly
            readOnly={true}
            height="200px"
            id="readonly-editor"
            ariaLabel="Read-only content view"
          />
          <p className="text-sm text-gray-500 mt-2">
            This editor is in read-only mode. Content cannot be edited.
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-300">
          Implementation Notes
        </h2>
        <ul className="list-disc list-inside space-y-2 text-blue-700 dark:text-blue-300">
          <li>The editor uses SimpleMDE (Markdown editor) with custom styling and accessibility enhancements</li>
          <li>Dark mode support is implemented with custom CSS</li>
          <li>Images can be uploaded via the toolbar (with server integration)</li>
          <li>Multiple toolbar configurations are available (full, basic, minimal)</li>
          <li>Editor content can be saved to your database with appropriate sanitization</li>
        </ul>
      </div>
      
      <div className="mt-8">
        <button
          type="button"
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors"
          onClick={() => {
            alert('Content saved! In a real application, this would save to your database.');
          }}
          aria-label="Save content"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && alert('Content saved! In a real application, this would save to your database.')}
        >
          Save Content
        </button>
      </div>
    </div>
  );
};

export default AdminEditorPage;
