import React from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface AdminFormLayoutProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  cardVariant?: 'default' | 'bordered' | 'elevated';
  actions?: React.ReactNode;
}

export default function AdminFormLayout({
  children,
  onSubmit,
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel = 'Save Changes',
  isSubmitting = false,
  cardVariant = 'default',
  actions
}: AdminFormLayoutProps) {
  return (
    <Card variant={cardVariant}>
      <form onSubmit={onSubmit} className="p-6 space-y-6">
        {children}
        
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button 
              variant="outline" 
              type="button" 
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          )}
          
          {actions}
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
} 