import React from 'react';
import Card from '@/components/Card';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  cardVariant?: 'default' | 'bordered' | 'elevated';
}

export default function AdminDataTable<T>({
  columns,
  data,
  keyField,
  emptyMessage = 'No items found.',
  onRowClick,
  rowClassName,
  cardVariant = 'default'
}: AdminDataTableProps<T>) {
  if (data.length === 0) {
    return (
      <Card variant={cardVariant}>
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
          {emptyMessage}
        </div>
      </Card>
    );
  }

  return (
    <Card variant={cardVariant} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {data.map((item) => (
              <tr 
                key={String(item[keyField])} 
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''} ${rowClassName ? rowClassName(item) : ''}`}
              >
                {columns.map((column, index) => {
                  const cell = typeof column.accessor === 'function' 
                    ? column.accessor(item)
                    : item[column.accessor];
                  
                  return (
                    <td key={index} className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}>
                      {cell as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface AdminFilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminFilterBar({ children, className = '' }: AdminFilterBarProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6 flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  );
}

interface AdminFilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export function AdminFilterButton({ 
  children, 
  isActive = false, 
  className = '',
  ...props
}: AdminFilterButtonProps) {
  return (
    <button
      className={`px-3 py-1 text-sm rounded-full ${
        isActive
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 