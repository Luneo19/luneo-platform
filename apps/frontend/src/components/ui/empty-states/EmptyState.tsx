import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('p-12 bg-gray-800/30 border-gray-700 border-dashed text-center', className)}>
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 text-gray-600 mb-4 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-400 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

