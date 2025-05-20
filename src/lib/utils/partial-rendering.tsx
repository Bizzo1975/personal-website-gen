/**
 * Partial Rendering Utilities
 * 
 * This module provides helpers for implementing Next.js 14 Partial Rendering
 * which allows parts of a page to be re-rendered without a full page refresh
 */

'use client';

import React, { useState, useTransition, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface PartialRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Wrapper component for implementing partial rendering
 * This creates a boundary that can be refreshed independently
 */
export function PartialRender({ children, fallback, className }: PartialRenderProps) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <div className={className}>
      {isPending && fallback ? fallback : children}
    </div>
  );
}

/**
 * Hook for refreshing only a portion of the UI
 * @returns Methods for triggering partial refreshes
 */
export function usePartialRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Refresh the current route without full navigation
  const refreshCurrent = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);
  
  return {
    isPending,
    refreshCurrent,
    startTransition
  };
}

/**
 * Form component that handles form submissions with partial refreshes
 */
export function PartialRefreshForm({
  children,
  action,
  onSuccess,
  className,
  ...props
}: {
  children: ReactNode;
  action: (formData: FormData) => Promise<any>;
  onSuccess?: (result: any) => void;
  className?: string;
  [key: string]: any;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      startTransition(async () => {
        const result = await action(formData);
        if (onSuccess) onSuccess(result);
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      {children}
      {formError && (
        <div className="text-red-500 mt-2">{formError}</div>
      )}
    </form>
  );
}
