'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, wrapperClassName = 'mb-4', className = '', ...props }, ref) => {
    return (
      <div className={wrapperClassName}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 border border-slate-300 dark:border-slate-600 
                    rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                    bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${className} ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 