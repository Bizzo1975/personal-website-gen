import React from 'react';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  backAction?: {
    label?: string;
    href?: string;
  };
  status?: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  };
}

export default function AdminPageLayout({
  children,
  title,
  description,
  action,
  backAction,
  status
}: AdminPageLayoutProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Action buttons - Removed title and description */}
      {(action || backAction) && (
        <div className="flex justify-end gap-3 mb-6">
          {backAction && (
            <Button 
              variant="outline" 
              onClick={() => backAction.href ? router.push(backAction.href) : router.back()}
            >
              {backAction.label || 'Back'}
            </Button>
          )}
          
          {action && (
            <Button 
              href={action.href} 
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
      
      {/* Status Messages */}
      {status && (
        <div 
          className={`px-4 py-3 rounded border ${
            status.type === 'success' 
              ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300' 
              : status.type === 'error'
              ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300'
              : status.type === 'warning'
              ? 'bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-300'
              : 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
          }`}
        >
          {status.message}
        </div>
      )}
      
      {/* Page Content */}
      {children}
    </div>
  );
} 