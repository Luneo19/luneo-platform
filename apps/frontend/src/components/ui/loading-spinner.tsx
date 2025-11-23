import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
  variant = 'default',
}) => {
  const spinnerClasses = cn(
    sizeClasses[size],
    className
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-blue-600 animate-pulse',
                  size === 'sm' ? 'w-1 h-1' : 
                  size === 'md' ? 'w-2 h-2' : 
                  size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={cn('rounded-full bg-blue-600 animate-pulse', spinnerClasses)} />
        );

      case 'bars':
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-blue-600 animate-pulse',
                  size === 'sm' ? 'w-1 h-2' : 
                  size === 'md' ? 'w-1 h-4' : 
                  size === 'lg' ? 'w-2 h-6' : 'w-2 h-8'
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        );

      default:
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
              spinnerClasses
            )}
          />
        );
    }
  };

  if (text) {
    return (
      <div className="flex flex-col items-center space-y-2">
        {renderSpinner()}
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    );
  }

  return renderSpinner();
};

// Composant de skeleton pour les placeholders
export const Skeleton: React.FC<{
  className?: string;
  lines?: number;
}> = ({ className, lines = 1 }) => {
  if (lines === 1) {
    return (
      <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200 rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full',
            className
          )}
        />
      ))}
    </div>
  );
};

// Composant de skeleton pour les cartes
export const CardSkeleton: React.FC<{
  showAvatar?: boolean;
  showActions?: boolean;
}> = ({ showAvatar = false, showActions = false }) => {
  return (
    <div className="animate-pulse p-6 bg-white rounded-lg border">
      <div className="flex items-center space-x-4 mb-4">
        {showAvatar && (
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
      {showActions && (
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
      )}
    </div>
  );
};

// Composant de skeleton pour les tableaux
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={cn(
                  'h-4 bg-gray-200 rounded',
                  colIndex === 0 ? 'w-1/4' : 'w-1/6'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;


