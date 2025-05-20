'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

// Import styles
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues and handle refs properly
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    // Return a wrapper component that properly handles the ref
    return React.forwardRef<any, any>((props, ref) => <RQ ref={ref} {...props} />);
  },
  {
    ssr: false,
    loading: () => <div className="h-60 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md" aria-label="Loading editor..." />
  }
);

// Define editor module types
interface EditorModules {
  toolbar: any;
  clipboard: {
    matchVisual: boolean;
  };
  imageResize?: {
    parchment: any;
    modules: string[];
  };
}

// Define Quill formats
const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
  'list', 'bullet', 'indent',
  'link', 'image', 'video',
  'color', 'background',
  'align', 'direction',
  'code', 'formula', 'script'
];

// Define editor modules with customizable toolbar
const defaultModules: EditorModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['blockquote', 'code-block'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false
  }
};

interface EnhancedEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  modules?: Partial<EditorModules>;
  readOnly?: boolean;
  height?: string;
  maxHeight?: string;
  toolbar?: 'full' | 'basic' | 'minimal';
  onImageUpload?: (file: File) => Promise<string>;
  id?: string;
  ariaLabel?: string;
}

const EnhancedEditor: React.FC<EnhancedEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write something amazing...',
  className = '',
  modules = {},
  readOnly = false,
  height = '300px',
  maxHeight = '600px',
  toolbar = 'full',
  onImageUpload,
  id = 'enhanced-editor',
  ariaLabel = 'Rich text editor'
}) => {
  const { theme } = useTheme();
  const [editorValue, setEditorValue] = useState(value);
  const [mounted, setMounted] = useState(false);
  const quillRef = useRef<any>(null);
  
  // Early return for SSR
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Toolbar configurations
  const toolbarOptions = {
    full: defaultModules.toolbar,
    basic: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      ['link', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
    minimal: [
      ['bold', 'italic', 'underline'],
      ['link'],
      ['clean']
    ]
  };
  
  // Combine default modules with custom modules
  const editorModules: EditorModules = {
    ...defaultModules,
    ...modules,
    toolbar: modules.toolbar || toolbarOptions[toolbar]
  };
  
  // Custom image handler
  const handleImageUpload = async (file: File): Promise<string> => {
    if (!onImageUpload) {
      return URL.createObjectURL(file);
    }
    
    try {
      return await onImageUpload(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };
  
  // Update the editor value when the prop changes
  useEffect(() => {
    if (value !== editorValue) {
      setEditorValue(value);
    }
  }, [value, editorValue]);
  
  // Setup editor and theme
  useEffect(() => {
    setMounted(true);
    
    // Add image upload handler to the toolbar
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      if (quill && quill.getModule('toolbar')) {
        const toolbar = quill.getModule('toolbar');
        
        toolbar.addHandler('image', () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.setAttribute('aria-label', 'Upload image');
          input.click();
          
          input.onchange = async () => {
            if (!input.files) return;
            const file = input.files[0];
            
            try {
              const url = await handleImageUpload(file);
              const range = quill.getSelection();
              quill.insertEmbed(range.index, 'image', url);
            } catch (error) {
              console.error('Image upload failed:', error);
              // You could show a toast notification here
            }
          };
        });
      }
    }
    
    // Apply dark mode styles to the editor
    const applyThemeStyles = () => {
      if (typeof document !== 'undefined') {
        const editorContainer = document.querySelector('.quill');
        if (!editorContainer) return;
        
        if (theme === 'dark') {
          editorContainer.classList.add('quill-dark');
        } else {
          editorContainer.classList.remove('quill-dark');
        }
      }
    };
    
    applyThemeStyles();
    
    return () => {
      // Cleanup if needed
    };
  }, [theme, onImageUpload, quillRef]);
  
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
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={editorModules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ 
          height: 'auto', 
          minHeight: height, 
          maxHeight 
        }}
        id={id}
        aria-label={ariaLabel}
        tabIndex={0}
      />
      
      {/* Accessibility description */}
      <div className="sr-only" id={`${id}-description`}>
        Use the toolbar above to format text. Press Tab to navigate between formatting options.
      </div>
      
      {/* Custom styles for dark mode */}
      {theme === 'dark' && (
        <style jsx global>{`
          .quill-dark .ql-toolbar {
            background-color: #1f2937;
            border-color: #374151;
          }
          
          .quill-dark .ql-container {
            background-color: #111827;
            border-color: #374151;
            color: #e5e7eb;
          }
          
          .quill-dark .ql-editor {
            color: #e5e7eb;
          }
          
          .quill-dark .ql-picker {
            color: #e5e7eb;
          }
          
          .quill-dark .ql-stroke {
            stroke: #e5e7eb;
          }
          
          .quill-dark .ql-fill {
            fill: #e5e7eb;
          }
          
          .quill-dark .ql-picker-options {
            background-color: #1f2937;
            border-color: #374151;
          }
          
          .quill-dark .ql-tooltip {
            background-color: #1f2937;
            border-color: #374151;
            color: #e5e7eb;
          }
          
          .quill-dark .ql-editor code-block {
            background-color: #111827;
            color: #e5e7eb;
          }
          
          .quill-dark .ql-editor pre {
            background-color: #111827;
            color: #e5e7eb;
          }
          
          /* Focus states for accessibility */
          .quill-dark .ql-toolbar button:focus,
          .quill-dark .ql-toolbar .ql-picker:focus {
            outline: 2px solid #60a5fa;
            outline-offset: 2px;
          }
        `}</style>
      )}
    </div>
  );
};

export default EnhancedEditor;
