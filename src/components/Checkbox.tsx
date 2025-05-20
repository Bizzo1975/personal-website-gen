'use client';

import React, { forwardRef } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  wrapperClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, wrapperClassName = 'mb-4', className = '', ...props }, ref) => {
    return (
      <div className={wrapperClassName}>
        <div className="flex items-center">
          <input
            type="checkbox"
            ref={ref}
            className={`h-4 w-4 text-primary-600 border-slate-300 dark:border-slate-600 
                      rounded focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 ${className} ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            {...props}
          />
          <label 
            htmlFor={props.id || props.name} 
            className="ml-2 block text-sm text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox'; 