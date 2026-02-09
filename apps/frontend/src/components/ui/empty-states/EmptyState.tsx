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
    <Card className={cn('dash-card p-12 bg-white/[0.03] border-white/[0.06] border-dashed text-center backdrop-blur-sm', className)}>
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 text-white/40 mb-4 flex items-center justify-center [&>svg]:text-white/40">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/60 mb-6 max-w-md">{description}</p>
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

