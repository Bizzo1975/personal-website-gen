'use client';

import React from 'react';

type CodeBlockProps = {
  children: string;
  language?: string;
  className?: string;
};

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language = 'text',
  className = '',
}) => {
  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-400 text-xs">
        <span>{language}</span>
        <button 
          className="hover:text-white transition-colors" 
          onClick={() => {
            navigator.clipboard.writeText(children);
          }}
          aria-label="Copy code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <pre className="bg-tech-codeDark p-4 overflow-x-auto text-sm font-mono text-slate-300">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock; 