'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import TextArea from '../TextArea';

// MDEditor configuration is handled internally

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
  }, [theme, onImageUpload]);
  
  // Handle editor value changes
  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };
  
  if (!mounted) {
    return (
      <div 
        className="h-60 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md" 
        aria-label="Loading editor..."
      />
    );
  }
  
  return (
    <div 
      className={`enhanced-editor ${theme === 'dark' ? 'dark-theme' : 'light-theme'} ${className}`}
      style={{ height }}
      id={`${id}-container`}
    >
      <TextArea
        value={editorValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        id={id}
        aria-label={ariaLabel}
        rows={15}
        className="w-full min-h-[300px] resize-y"
      />
      
      {/* Accessibility description */}
      <div className="sr-only" id={`${id}-description`}>
        Text editor for content creation. Supports markdown formatting.
      </div>
      
      {/* MDEditor handles its own theming */}
    </div>
  );
};

export default EnhancedEditor;
