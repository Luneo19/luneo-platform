'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, Home, Copy, WifiOff, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

type ErrorLevel = 'component' | 'page' | 'global' | 'api' | '3d' | 'ar';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: ErrorLevel;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  disableReset?: boolean;
  /** Nombre max de retries automatiques */
  maxRetries?: number;
  /** Délai entre les retries (ms) */
  retryDelay?: number;
  /** Afficher le bouton "Signaler une erreur" */
  showReportButton?: boolean;
  /** Callback quand l'utilisateur signale une erreur */
  onReport?: (error: Error, userMessage?: string) => void;
  /** Nom du composant pour le logging */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  isOnline: boolean;
  copied: boolean;
}

// ============================================
// MAIN ERROR BOUNDARY CLASS
// ============================================

/**
 * Error Boundary Avancé pour capturer et récupérer des erreurs React
 * 
 * Fonctionnalités:
 * - Capture des erreurs React (component, page, global, api, 3d, ar)
 * - Retry automatique avec backoff exponentiel
 * - Détection online/offline
 * - Logging professionnel avec Sentry
 * - Reset automatique sur changement de props
 * - UI de fallback personnalisable
 * - Signalement d'erreur par l'utilisateur
 * - Copie des détails d'erreur
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private retryTimeoutId: NodeJS.Timeout | null = null;
  
  static defaultProps = {
    level: 'component' as ErrorLevel,
    maxRetries: 2,
    retryDelay: 1000,
    showReportButton: true,
  };
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidMount() {
    // Écouter les changements de connectivité
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const hasResetKeyChanged = 
      resetKeys && 
      resetKeys.some((key, index) => prevProps.resetKeys?.[index] !== key);
    
    if (
      (hasResetKeyChanged || resetOnPropsChange) &&
      this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId);
    if (this.retryTimeoutId) clearTimeout(this.retryTimeoutId);
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  private isExtensionError(error: Error, errorInfo: ErrorInfo): boolean {
    const patterns = [
      'frame_start.js',
      'frame_ant.js',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
    ];
    const msg = error.message || '';
    const stack = error.stack || '';
    const componentStack = errorInfo.componentStack || '';

    return patterns.some(
      (p) => msg.includes(p) || stack.includes(p) || componentStack.includes(p)
    );
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'component', onError, componentName, maxRetries = 2 } = this.props;

    if (this.isExtensionError(error, errorInfo)) {
      logger.warn('[Luneo] Browser extension error ignored:', { message: error.message });
      this.setState({ hasError: false, error: null, errorInfo: null });
      return;
    }
    
    logger.error(`ErrorBoundary caught an error (${level}${componentName ? `: ${componentName}` : ''})`, error, {
      level,
      componentName,
      componentStack: errorInfo.componentStack,
      errorInfo,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      retryCount: this.state.retryCount,
      isOnline: this.state.isOnline,
    });
    
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (callbackError) {
        logger.error('Error in ErrorBoundary onError callback', callbackError as Error);
      }
    }

    this.sendToSentry(error, errorInfo);

    this.setState({ error, errorInfo });

    if (this.state.retryCount < maxRetries && this.shouldAutoRetry(error)) {
      this.autoRetry();
    }
  }

  private sendToSentry(error: Error, errorInfo: ErrorInfo) {
    if (typeof window !== 'undefined') {
      try {
        const sentry = (window as Window & { Sentry?: { captureException: (error: Error, options?: object) => void } }).Sentry;
        if (sentry && sentry.captureException) {
          sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
                level: this.props.level,
                componentName: this.props.componentName,
              },
            },
            tags: {
              errorBoundary: true,
              errorBoundaryLevel: this.props.level,
              retryCount: this.state.retryCount,
            },
          });
        }
      } catch (sentryError) {
        logger.warn('Failed to send error to Sentry', { error: sentryError });
      }
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Ne pas retry pour certains types d'erreurs
    const nonRetryableErrors = [
      'ChunkLoadError',
      'SyntaxError',
      'ReferenceError',
    ];
    
    if (nonRetryableErrors.some(type => error.name === type)) {
      return false;
    }
    
    // Retry si c'est une erreur réseau et qu'on est online
    if (!this.state.isOnline) {
      return false;
    }
    
    return true;
  }

  private autoRetry() {
    const { retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;
    
    this.setState({ isRetrying: true });
    
    // Backoff exponentiel
    const delay = retryDelay * Math.pow(2, retryCount);
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, delay);
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
    // Si on était en erreur et qu'on revient en ligne, proposer un retry
    if (this.state.hasError) {
      logger.info('Connection restored - error recovery available');
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId);
    if (this.retryTimeoutId) clearTimeout(this.retryTimeoutId);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      copied: false,
    });
    
    logger.info('ErrorBoundary reset', {
      level: this.props.level,
      componentName: this.props.componentName,
    });
  };

  handleReset = () => {
    this.resetErrorBoundary();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorText = `Error: ${error.name}
Message: ${error.message}
Stack: ${error.stack}
${errorInfo ? `Component Stack: ${errorInfo.componentStack}` : ''}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Time: ${new Date().toISOString()}`;

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      logger.error('Failed to copy error to clipboard', err as Error);
    }
  };

  handleReport = () => {
    const { onReport } = this.props;
    const { error } = this.state;
    
    if (onReport && error) {
      onReport(error);
    } else {
      // Fallback: ouvrir un lien mailto ou la page support
      const subject = encodeURIComponent(`Bug Report: ${error?.name || 'Unknown Error'}`);
      const body = encodeURIComponent(`
Description de l'erreur:
${error?.message || 'Erreur inconnue'}

URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}

Stack trace:
${error?.stack || 'Non disponible'}
      `);
      
      window.open(`mailto:support@luneo.app?subject=${subject}&body=${body}`);
    }
  };

  render() {
    const { hasError, error, errorInfo, isRetrying, isOnline, copied, retryCount } = this.state;
    const { children, fallback, disableReset, maxRetries = 2, showReportButton } = this.props;

    if (hasError) {
      // Fallback personnalisé (fonction ou ReactNode)
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error!, this.resetErrorBoundary);
        }
        return fallback;
      }

      // UI de fallback par défaut
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Status indicator */}
              {!isOnline && (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                  <WifiOff className="w-4 h-4" />
                  Vous êtes hors ligne
                </div>
              )}
              
              {isRetrying && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Tentative de récupération... ({retryCount + 1}/{maxRetries})
                </div>
              )}
              
              {/* Icon */}
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              
              {/* Title & Description */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Oups ! Une erreur s'est produite
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {isOnline 
                    ? 'Nous avons rencontré un problème inattendu. Notre équipe a été notifiée.'
                    : 'La connexion internet semble interrompue. Vérifiez votre connexion et réessayez.'
                  }
                </p>
              </div>

              {/* Dev Error Details */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="w-full mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                      Détails de l'erreur (dev only)
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={this.handleCopyError}
                      className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      {copied ? '✓ Copié' : <><Copy className="w-3 h-3 mr-1" /> Copier</>}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300">Erreur:</p>
                      <p className="text-sm font-mono text-red-800 dark:text-red-200 break-all">
                        {error.name}: {error.message}
                      </p>
                    </div>
                    
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                          Stack trace
                        </summary>
                        <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                    
                    {errorInfo?.componentStack && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                          Component stack
                        </summary>
                        <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                          {errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {!disableReset && (
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={isRetrying}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                    Réessayer
                  </Button>
                )}
                <Button
                  onClick={this.handleRefreshPage}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Rafraîchir la page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="w-full sm:w-auto"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </div>

              {/* Report & Help */}
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500 dark:text-gray-400">
                {showReportButton && (
                  <button
                    onClick={this.handleReport}
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Signaler ce problème
                  </button>
                )}
                <a
                  href="/help/support"
                  className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Contacter le support
                </a>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// ============================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================

/**
 * Error Boundary spécialisé pour les erreurs API
 */
export function ApiErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="api" componentName="API" {...props}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary spécialisé pour les composants 3D
 */
export function ThreeDErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  const fallback = (error: Error, reset: () => void) => (
    <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center space-y-4">
        <div className="text-4xl">🎨</div>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Erreur de rendu 3D
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Le visualiseur 3D a rencontré un problème.
          Votre navigateur supporte-t-il WebGL ?
        </p>
        <Button onClick={reset} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary level="3d" componentName="3DViewer" fallback={fallback} {...props}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary spécialisé pour les composants AR
 */
export function ARErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  const fallback = (error: Error, reset: () => void) => (
    <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center space-y-4">
        <div className="text-4xl">📱</div>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Erreur AR
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          La réalité augmentée n'est pas disponible.
          Vérifiez les permissions de la caméra.
        </p>
        <Button onClick={reset} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary level="ar" componentName="ARViewer" fallback={fallback} {...props}>
      {children}
    </ErrorBoundary>
  );
}

// ============================================
// HOC & HOOKS
// ============================================

/**
 * HOC pour wrapper un composant avec ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const displayName = Component.displayName || Component.name || 'Component';
  
  function WrappedComponent(props: P) {
    return (
      <ErrorBoundary componentName={displayName} {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  return WrappedComponent;
}

/**
 * Hook pour gérer les erreurs dans les composants fonctionnels
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);
  
  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err);
    } else {
      setError(new Error(String(err)));
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Relancer l'erreur pour qu'elle soit capturée par le ErrorBoundary
  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { handleError, clearError };
}

/**
 * Composant wrapper simple
 */
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page">
      {children}
    </ErrorBoundary>
  );
}
