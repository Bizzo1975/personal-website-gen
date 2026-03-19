'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

// Use SimpleMDE (markdown editor) - already in project, doesn't cause build issues
// Provides better visual formatting than plain textarea
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import 'easymde/dist/easymde.min.css';

interface EnhancedEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  height?: string;
  maxHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
  id?: string;
  ariaLabel?: string;
  toolbar?: 'basic' | 'full' | 'minimal';
}

const EnhancedEditor: React.FC<EnhancedEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write something amazing...',
  className = '',
  readOnly = false,
  height = '300px',
  maxHeight = '600px',
  onImageUpload,
  id = 'enhanced-editor',
  ariaLabel = 'Rich text editor',
  toolbar = 'full'
}) => {
  const { theme } = useTheme();
  const [editorValue, setEditorValue] = useState(value);
  const [mounted, setMounted] = useState(false);
  
  // Update the editor value when the prop changes
  useEffect(() => {
    if (value !== editorValue) {
      setEditorValue(value);
    }
  }, [value, editorValue]);
  
  // Setup editor
  useEffect(() => {
    setMounted(true);
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // Handle editor value changes
  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };
  
  // Configure toolbar based on prop
  const getToolbar = () => {
    const baseToolbar = ['bold', 'italic', 'strikethrough', '|', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', '|', 'preview', 'side-by-side', 'fullscreen'];
    
    if (toolbar === 'minimal') {
      return ['bold', 'italic', '|', 'link'];
    } else if (toolbar === 'basic') {
      return ['bold', 'italic', '|', 'heading', '|', 'unordered-list', 'ordered-list', '|', 'link', 'image'];
    } else {
      return baseToolbar;
    }
  };
  
  if (!mounted) {
    return (
      <div 
        className="h-60 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md flex items-center justify-center" 
        aria-label="Loading editor..."
      >
        <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
      </div>
    );
  }
  
  return (
    <div 
      className={`enhanced-editor ${theme === 'dark' ? 'dark-theme' : 'light-theme'} ${className}`}
      style={{ height, maxHeight }}
      id={`${id}-container`}
    >
      <style jsx global>{`
        .enhanced-editor .EasyMDEContainer {
          min-height: ${height};
          max-height: ${maxHeight};
        }
        .enhanced-editor .EasyMDEContainer .CodeMirror {
          min-height: ${height};
          max-height: ${maxHeight};
          font-family: inherit;
          font-size: 1rem;
        }
        .enhanced-editor.dark-theme .EasyMDEContainer {
          background-color: #1f2937;
        }
        .enhanced-editor.dark-theme .EasyMDEContainer .CodeMirror {
          background-color: #1f2937;
          color: #f3f4f6;
          border-color: #374151;
        }
        .enhanced-editor.dark-theme .EasyMDEContainer .editor-toolbar {
          background-color: #111827;
          border-color: #374151;
        }
        .enhanced-editor.dark-theme .EasyMDEContainer .editor-toolbar button {
          color: #d1d5db;
        }
        .enhanced-editor.dark-theme .EasyMDEContainer .editor-toolbar button:hover,
        .enhanced-editor.dark-theme .EasyMDEContainer .editor-toolbar button.active {
          background-color: #374151;
          border-color: #4b5563;
        }
        .enhanced-editor.light-theme .EasyMDEContainer .CodeMirror {
          background-color: #ffffff;
          color: #111827;
          border-color: #e5e7eb;
        }
        .enhanced-editor.light-theme .EasyMDEContainer .editor-toolbar {
          background-color: #f9fafb;
          border-color: #e5e7eb;
        }
      `}</style>
      <SimpleMDE
        value={editorValue}
        onChange={handleChange}
        options={{
          placeholder: placeholder,
          spellChecker: false,
          status: false,
          autofocus: false,
          toolbar: getToolbar(),
          minHeight: height,
          maxHeight: maxHeight,
          lineNumbers: false,
          lineWrapping: true,
          renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: true,
          }
        }}
      />
      
      {/* Accessibility description */}
      <div className="sr-only" id={`${id}-description`}>
        Markdown editor for content creation with formatting options and live preview.
      </div>
    </div>
  );
};

export default EnhancedEditor;
