'use client';

import React, { useState, KeyboardEvent } from 'react';
import Badge from './Badge';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}

export function TagInput({ 
  label, 
  value = [], 
  onChange, 
  placeholder = 'Add a tag and press Enter', 
  error 
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      
      // Check if tag already exists
      if (!value.includes(inputValue.trim())) {
        const newTags = [...value, inputValue.trim()];
        onChange(newTags);
      }
      
      setInputValue('');
    }
  };

  const removeTag = (tag: string) => {
    const newTags = value.filter(t => t !== tag);
    onChange(newTags);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 
                     rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                     bg-white dark:bg-white text-slate-900 dark:text-slate-800"
          aria-label={label}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-2">
        {value.map((tag, index) => (
          <div 
            key={index} 
            className="flex items-center cursor-pointer" 
            onClick={() => removeTag(tag)}
          >
            <Badge
              variant="secondary"
              className="pr-1"
            >
              {tag} <span className="ml-1 text-xs">&times;</span>
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}