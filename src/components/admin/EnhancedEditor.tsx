'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { marked } from 'marked';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setEditorValue(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  const isDark = theme === 'dark';

  const previewRender = useCallback((text: string) => {
    const html = marked(text) as string;
    const bg = isDark ? '#1e293b' : '#ffffff';
    const fg = isDark ? '#e2e8f0' : '#111827';
    const h = isDark ? '#f1f5f9' : '#111827';
    const link = isDark ? '#818cf8' : '#4f46e5';
    const border = isDark ? '#334155' : '#e5e7eb';
    const codeBg = isDark ? '#0f172a' : '#f3f4f6';
    const inlineBg = isDark ? '#334155' : '#f3f4f6';
    const bqBorder = isDark ? '#818cf8' : '#6366f1';
    const bqColor = isDark ? '#94a3b8' : '#6b7280';
    const thBg = isDark ? '#1e3a5f' : '#f9fafb';

    return '<div style="background:' + bg + ';color:' + fg + ';padding:16px;min-height:100%;font-family:Inter,sans-serif;font-size:14px;line-height:1.6;">'
      + '<style>'
      + '.mde-preview-content h1,.mde-preview-content h2,.mde-preview-content h3,.mde-preview-content h4{color:' + h + ' !important;margin:1rem 0 0.5rem;}'
      + '.mde-preview-content h2{border-bottom:1px solid ' + border + ';padding-bottom:0.4rem;}'
      + '.mde-preview-content p{margin:0 0 1rem;color:' + fg + ';}'
      + '.mde-preview-content a{color:' + link + ';}'
      + '.mde-preview-content ul,.mde-preview-content ol{padding-left:1.5rem;margin:0 0 1rem;color:' + fg + ';}'
      + '.mde-preview-content li{margin:0.25rem 0;color:' + fg + ';}'
      + '.mde-preview-content blockquote{border-left:4px solid ' + bqBorder + ';color:' + bqColor + ';padding:0.5rem 1rem;margin:1rem 0;}'
      + '.mde-preview-content code{background:' + inlineBg + ';color:' + fg + ';padding:0.2em 0.4em;border-radius:3px;font-family:monospace;}'
      + '.mde-preview-content pre{background:' + codeBg + ';color:' + fg + ';padding:1rem;border-radius:6px;overflow-x:auto;margin:1rem 0;}'
      + '.mde-preview-content pre code{background:none;padding:0;color:inherit;}'
      + '.mde-preview-content hr{border:none;border-top:1px solid ' + border + ';margin:1.5rem 0;}'
      + '.mde-preview-content table{width:100%;border-collapse:collapse;margin:1rem 0;}'
      + '.mde-preview-content th,.mde-preview-content td{border:1px solid ' + border + ';padding:0.5rem 0.75rem;color:' + fg + ';}'
      + '.mde-preview-content th{background:' + thBg + ';}'
      + '.mde-preview-content strong{color:' + h + ';}'
      + '</style>'
      + '<div class="mde-preview-content">' + html + '</div>'
      + '</div>';
  }, [isDark]);

  const getToolbar = () => {
    const base = ['bold','italic','strikethrough','|','heading','|','quote','unordered-list','ordered-list','|','link','image','|','preview','side-by-side','fullscreen'];
    if (toolbar === 'minimal') return ['bold','italic','|','link'];
    if (toolbar === 'basic') return ['bold','italic','|','heading','|','unordered-list','ordered-list','|','link','image'];
    return base;
  };

  if (!mounted) {
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div
      className={'enhanced-editor ' + className}
      style={{ height, maxHeight, overflow: 'hidden', position: 'relative' }}
      id={id + '-container'}
    >
      <SimpleMDE
        value={editorValue}
        onChange={handleChange}
        options={{
          placeholder: placeholder,
          spellChecker: false,
          status: false,
          autofocus: false,
          toolbar: getToolbar() as any,
          minHeight: height,
          maxHeight: maxHeight,
          lineWrapping: true,
          previewRender: previewRender,
          renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: false,
          }
        }}
      />
    </div>
  );
};

export default EnhancedEditor;
