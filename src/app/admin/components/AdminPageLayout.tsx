import React from 'react';
import Button from '@/components/Button';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  backAction?: {
    label?: string;
    href?: string;
  };
  status?: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    dismissible?: boolean;
  };
  breadcrumbs?: BreadcrumbItem[];
}

export default function AdminPageLayout({
  children,
  title,
  description,
  action,
  backAction,
  status,
  breadcrumbs
}: AdminPageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showStatus, setShowStatus] = React.useState(true);

  // Generate automatic breadcrumbs based on the current path if not provided
  const autoBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs) return breadcrumbs;
    
    if (!pathname) return [];
    
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href,
      };
    });
  }, [pathname, breadcrumbs]);

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      {autoBreadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 text-sm">
            <li className="inline-flex items-center">
              <Link 
                href="/admin/dashboard" 
                className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
              >
                Dashboard
              </Link>
            </li>
            {autoBreadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center">
                <span className="mx-1 text-slate-400">/</span>
                {index === autoBreadcrumbs.length - 1 ? (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{crumb.label}</span>
                ) : (
                  <Link 
                    href={crumb.href || '#'} 
                    className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Page Header with title and actions */}
      {(title || action || backAction) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {title && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
              {description && (
                <p className="mt-1 text-slate-500 dark:text-slate-400 max-w-2xl">{description}</p>
              )}
            </div>
          )}
          
          {(action || backAction) && (
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              {backAction && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => backAction.href ? router.push(backAction.href) : router.back()}
                >
                  {backAction.label || 'Back'}
                </Button>
              )}
              
              {action && (
                <Button 
                  href={action.href} 
                  onClick={action.onClick}
                  size="sm"
                  icon={action.icon}
                >
                  {action.label}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Status Messages */}
      {status && showStatus && (
        <div 
          className={`p-4 rounded-lg border flex items-center justify-between ${
            status.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700/30 dark:text-green-300' 
              : status.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-300'
              : status.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700/30 dark:text-yellow-300'
              : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700/30 dark:text-blue-300'
          }`}
        >
          <div className="flex-1">{status.message}</div>
          {status.dismissible && (
            <button 
              onClick={() => setShowStatus(false)}
              className="ml-3 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {/* Page Content */}
      {children}
    </div>
  );
} 