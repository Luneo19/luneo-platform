'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  title = 'Une erreur est survenue',
  message,
  error,
  onRetry,
  className = '',
}: ErrorDisplayProps) {
  const errorMessage = message || (error instanceof Error ? error.message : String(error || 'Erreur inconnue'));

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        {errorMessage}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      )}
    </div>
  );
}
