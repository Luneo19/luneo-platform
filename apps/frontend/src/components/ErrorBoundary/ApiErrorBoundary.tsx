'use client';

/**
 * API Error Boundary
 * E-002: Error Boundary pour erreurs réseau avec retry
 */

import React, { useState, useCallback, ReactNode } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { WifiOff, RefreshCw, AlertCircle, Clock, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n/useI18n';

interface ApiError {
  status?: number;
  message: string;
  code?: string;
}

interface ApiErrorBoundaryProps {
  children: ReactNode;
  error?: ApiError | null;
  isLoading?: boolean;
  onRetry?: () => void;
  retryDelay?: number; // ms
  maxRetries?: number;
  fallback?: ReactNode;
}

export function ApiErrorBoundary({
  children,
  error,
  isLoading = false,
  onRetry,
  retryDelay = 1000,
  maxRetries = 3,
  fallback,
}: ApiErrorBoundaryProps) {
  const { t } = useI18n();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries || isRetrying) return;

    setIsRetrying(true);
    
    // Exponential backoff
    const delay = retryDelay * Math.pow(2, retryCount);
    setCountdown(Math.ceil(delay / 1000));

    // Countdown
    const interval = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, delay));
    clearInterval(interval);

    setRetryCount((c) => c + 1);
    setIsRetrying(false);
    onRetry?.();
  }, [retryCount, maxRetries, retryDelay, isRetrying, onRetry]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-blue-400" />
        </motion>
      </div>
    );
  }

  // No error
  if (!error) {
    return <>{children}</>;
  }

  // Custom fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Determine error type
  const isNetworkError = !error.status || error.status === 0;
  const isServerError = error.status && error.status >= 500;
  const isAuthError = error.status === 401 || error.status === 403;
  const isNotFound = error.status === 404;
  const isRateLimit = error.status === 429;

  const getErrorConfig = () => {
    if (isNetworkError) {
      return {
        icon: WifiOff,
        title: t('errors.connectionLost'),
        description: t('errors.connectionLostDesc'),
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        canRetry: true,
      };
    }
    if (isServerError) {
      return {
        icon: Server,
        title: t('common.serverError'),
        description: t('errors.serverErrorDesc'),
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        canRetry: true,
      };
    }
    if (isRateLimit) {
      return {
        icon: Clock,
        title: t('errors.rateLimit'),
        description: t('errors.rateLimitDesc'),
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        canRetry: true,
      };
    }
    if (isAuthError) {
      return {
        icon: AlertCircle,
        title: t('common.forbidden'),
        description: t('errors.forbiddenDesc'),
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        canRetry: false,
      };
    }
    if (isNotFound) {
      return {
        icon: AlertCircle,
        title: t('errors.resourceNotFound'),
        description: t('errors.resourceNotFoundDesc'),
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20',
        canRetry: false,
      };
    }
    return {
      icon: AlertCircle,
      title: t('common.error'),
      description: error.message || t('errors.unexpectedError'),
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      canRetry: true,
    };
  };

  const config = getErrorConfig();
  const Icon = config.icon;
  const canRetry = config.canRetry && retryCount < maxRetries && onRetry;

  return (
    <AnimatePresence mode="wait">
      <motion
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full ${config.bgColor} mb-4`}>
                <Icon className={`w-8 h-8 ${config.color}`} />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">
                {config.title}
              </h3>
              
              <p className="text-slate-400 mb-4 max-w-md">
                {config.description}
              </p>

              {/* Error details */}
              {error.status && (
                <p className="text-xs text-slate-500 mb-4">
                  Code: {error.status} {error.code && `(${error.code})`}
                </p>
              )}

              {/* Retry button */}
              {canRetry && (
                <div className="space-y-2">
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Nouvelle tentative dans {countdown}s...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Réessayer
                      </>
                    )}
                  </Button>
                  
                  {retryCount > 0 && (
                    <p className="text-xs text-slate-500">
                      Tentative {retryCount}/{maxRetries}
                    </p>
                  )}
                </div>
              )}

              {/* Auth error action */}
              {isAuthError && (
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Se connecter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion>
    </AnimatePresence>
  );
}

export default ApiErrorBoundary;


