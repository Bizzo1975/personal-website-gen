import React from 'react';

interface AdminFormFieldProps {
  id: string;
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function AdminFormField({
  id,
  label,
  error,
  helpText,
  required = false,
  className = '',
  children
}: AdminFormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {children}
      
      {helpText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {helpText}
        </p>
      )}
      
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  helpText?: string;
}

export function AdminInput({
  id,
  label,
  error,
  helpText,
  required,
  className = '',
  ...props
}: AdminInputProps) {
  return (
    <AdminFormField
      id={id}
      label={label}
      error={error}
      helpText={helpText}
      required={required}
      className={className}
    >
      <input
        id={id}
        className={`w-full p-2 border rounded-md dark:bg-slate-800 ${
          error 
            ? 'border-red-400 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
            : 'border-slate-300 dark:border-slate-700 focus:ring-primary-500 focus:border-primary-500'
        }`}
        required={required}
        {...props}
      />
    </AdminFormField>
  );
}

interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string;
  helpText?: string;
}

export function AdminTextarea({
  id,
  label,
  error,
  helpText,
  required,
  className = '',
  ...props
}: AdminTextareaProps) {
  return (
    <AdminFormField
      id={id}
      label={label}
      error={error}
      helpText={helpText}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        className={`w-full p-2 border rounded-md dark:bg-slate-800 ${
          error 
            ? 'border-red-400 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
            : 'border-slate-300 dark:border-slate-700 focus:ring-primary-500 focus:border-primary-500'
        }`}
        required={required}
        {...props}
      />
    </AdminFormField>
  );
}

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helpText?: string;
}

export function AdminSelect({
  id,
  label,
  options,
  error,
  helpText,
  required,
  className = '',
  ...props
}: AdminSelectProps) {
  return (
    <AdminFormField
      id={id}
      label={label}
      error={error}
      helpText={helpText}
      required={required}
      className={className}
    >
      <select
        id={id}
        className={`w-full p-2 border rounded-md dark:bg-slate-800 ${
          error 
            ? 'border-red-400 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
            : 'border-slate-300 dark:border-slate-700 focus:ring-primary-500 focus:border-primary-500'
        }`}
        required={required}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </AdminFormField>
  );
} 