'use client';

import React, { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  wrapperClassName?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helpText, wrapperClassName = 'mb-4', className = '', ...props }, ref) => {
    return (
      <div className={wrapperClassName}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2 border border-slate-300 dark:border-slate-600 
                    rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                    bg-white dark:bg-white text-slate-900 dark:text-slate-800 ${className} ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          {...props}
        />
        {helpText && !error && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea; 