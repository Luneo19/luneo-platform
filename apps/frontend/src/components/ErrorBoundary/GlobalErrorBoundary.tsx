'use client';

/**
 * Global Error Boundary
 * E-001: Error Boundary principal avec recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '../../lib/logger';
import { api } from '@/lib/api/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showStack: boolean;
  retryCount: number;
}

const MAX_RETRIES = 3;

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in development
    logger.error('GlobalErrorBoundary caught error:', error, errorInfo);

    // Report to error tracking service
    this.reportError(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // Report to Sentry or other service
    if (typeof window !== 'undefined' && (window as Window & { Sentry?: { captureException: (error: Error, options?: object) => void } }).Sentry) {
      (window as Window & { Sentry: { captureException: (error: Error, options?: object) => void } }).Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }

    // Also send to our API
    try {
      api.post('/api/v1/errors/report', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now(),
      }).catch(() => {
        // Silent fail for error reporting
      });
    } catch {
      // Silent fail
    }
  }

  private handleRetry = (): void => {
    if (this.state.retryCount < MAX_RETRIES) {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prev.retryCount + 1,
      }));
    }
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private toggleStack = (): void => {
    this.setState((prev) => ({ showStack: !prev.showStack }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showStack, retryCount } = this.state;
      const canRetry = retryCount < MAX_RETRIES;

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-slate-900 border-slate-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-red-500/20 rounded-full w-fit">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
              <CardTitle className="text-2xl text-white">
                Oups ! Une erreur est survenue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-400 text-center">
                Nous sommes désolés, quelque chose s'est mal passé. Notre équipe a été notifiée.
              </p>

              {/* Error message */}
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-red-400 font-mono text-sm break-all">
                  {error?.message || 'Unknown error'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer ({MAX_RETRIES - retryCount} restants)
                  </Button>
                )}
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1 border-slate-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recharger la page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-slate-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </div>

              {/* Stack trace (development) */}
              {this.props.showDetails !== false && (
                <div>
                  <button
                    onClick={this.toggleStack}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400"
                  >
                    <Bug className="w-4 h-4" />
                    Détails techniques
                    {showStack ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showStack && (
                    <pre className="mt-3 p-4 bg-slate-950 rounded-lg text-xs text-slate-500 overflow-auto max-h-48">
                      {error?.stack}
                      {errorInfo?.componentStack && (
                        <>
                          {'\n\nComponent Stack:\n'}
                          {errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  )}
                </div>
              )}

              {/* Support link */}
              <p className="text-center text-sm text-slate-500">
                Le problème persiste ?{' '}
                <a href="/support" className="text-blue-400 hover:underline">
                  Contactez le support
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;


