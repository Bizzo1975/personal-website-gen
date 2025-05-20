'use client';

import React, { useState } from 'react';
import TextArea from './TextArea';
import { Tab } from '@headlessui/react';
import MarkdownContent from './MarkdownContent';

interface MarkdownEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export default function MarkdownEditor({
  label,
  value,
  onChange,
  placeholder = 'Write your content in Markdown format...',
  error,
  required
}: MarkdownEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex mb-2 border-b border-slate-200 dark:border-slate-700">
          <Tab className={({ selected }) =>
            `py-2 px-4 text-sm font-medium border-b-2 transition-colors focus:outline-none
             ${selected 
               ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
               : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
             }`
          }>
            Write
          </Tab>
          <Tab className={({ selected }) =>
            `py-2 px-4 text-sm font-medium border-b-2 transition-colors focus:outline-none
             ${selected 
               ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
               : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
             }`
          }>
            Preview
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <TextArea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              error={error}
              rows={10}
              wrapperClassName="mb-0"
            />
          </Tab.Panel>
          <Tab.Panel>
            <div className="min-h-[250px] p-4 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 overflow-y-auto">
              {value ? (
                <MarkdownContent content={{ compiledSource: value }} />
              ) : (
                <p className="text-slate-400 dark:text-slate-500 italic">
                  Nothing to preview yet...
                </p>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
} 