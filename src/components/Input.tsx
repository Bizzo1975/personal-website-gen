'use client';

import React, { forwardRef, useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  floatingLabel?: boolean;
  helpText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    wrapperClassName = 'mb-4', 
    className = '', 
    floatingLabel = false,
    helpText,
    icon,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const isOccupied = isFocused || !!props.value || !!props.defaultValue;
    
    return (
      <div className={wrapperClassName}>
        {label && !floatingLabel && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}
          
          {floatingLabel && label && (
            <label 
              className={`absolute text-sm duration-200 transform ${
                isOccupied 
                  ? 'text-xs -translate-y-2 top-1 left-3 text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400 top-1/2 -translate-y-1/2 left-3'
              } pointer-events-none transition-all ${error ? '!text-red-500' : ''}`}
            >
              {label} {props.required && <span className="text-red-500">*</span>}
            </label>
          )}
          
          <input
            ref={ref}
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 
                     bg-white dark:bg-white text-slate-900 dark:text-slate-800
                     placeholder-slate-400 dark:placeholder-slate-500
                     ${icon ? 'pl-10' : ''}
                     ${floatingLabel ? (isOccupied ? 'pt-5 pb-2' : '') : ''}
                     ${
                      error 
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-red-700'
                        : 'border-slate-300 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:focus:border-primary-400'
                     } ${className}`}
            onFocus={(e) => {
              setIsFocused(true);
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (props.onBlur) props.onBlur(e);
            }}
            {...props}
          />
        </div>
        
        {(error || helpText) && (
          <p className={`mt-1.5 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {error || helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 