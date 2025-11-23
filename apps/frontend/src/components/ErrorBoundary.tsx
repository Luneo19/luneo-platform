'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Bug, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'component' | 'page' | 'global';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  disableReset?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary pour capturer les erreurs React
 * 
 * Composant professionnel de gestion d'erreurs incluant:
 * - Capture des erreurs React (component, page, global)
 * - Logging professionnel avec logger
 * - Intégration Sentry optionnelle
 * - Reset automatique sur changement de props
 * - UI de fallback personnalisable
 * - Détails d'erreur en mode dev
 * - Actions de récupération (reset, home)
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Mettre à jour l'état pour afficher l'UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  componentDidUpdate(prevProps: Props) {
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'component', onError } = this.props;
    
    // Log l'erreur avec le logger professionnel
    logger.error(`ErrorBoundary caught an error (${level})`, error, {
      level,
      componentStack: errorInfo.componentStack,
      errorInfo,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    
    // Appeler le callback si fourni
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (callbackError) {
        logger.error('Error in ErrorBoundary onError callback', callbackError as Error);
      }
    }

    // Envoyer à Sentry si disponible (via logger ou directement)
    if (typeof window !== 'undefined') {
      try {
        // Le logger gère déjà l'envoi à Sentry si configuré
        // Mais on peut aussi envoyer directement ici pour plus de contrôle
        const sentry = (window as any).Sentry;
        if (sentry && sentry.captureException) {
          sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
                level,
              },
            },
            tags: {
              errorBoundary: true,
              errorBoundaryLevel: level,
            },
          });
        }
      } catch (sentryError) {
        // Erreur Sentry, ignorer silencieusement
        logger.warn('Failed to send error to Sentry', sentryError as Error);
      }
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    logger.info('ErrorBoundary reset', {
      level: this.props.level,
    });
  };

  handleReset = () => {
    this.resetErrorBoundary();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorText = `Error: ${error.name}\n` +
      `Message: ${error.message}\n` +
      `Stack: ${error.stack}\n` +
      (errorInfo ? `Component Stack: ${errorInfo.componentStack}\n` : '');

    navigator.clipboard.writeText(errorText).then(() => {
      // Afficher un toast de confirmation si disponible
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast({
          title: 'Copié',
          description: 'Les détails de l\'erreur ont été copiés dans le presse-papiers',
        });
      }
    }).catch((err) => {
      logger.error('Failed to copy error to clipboard', err);
    });
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback par défaut
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Oups ! Une erreur s'est produite
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Nous avons rencontré un problème inattendu. Notre équipe a été notifiée.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
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
                      <Copy className="w-3 h-3 mr-1" />
                      Copier
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300">Erreur:</p>
                      <p className="text-sm font-mono text-red-800 dark:text-red-200 break-all">
                        {this.state.error.name}: {this.state.error.message}
                      </p>
                    </div>
                    
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                          Stack trace
                        </summary>
                        <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                    
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                          Component stack
                        </summary>
                        <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="w-full sm:w-auto"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Si le problème persiste, veuillez{' '}
                <a
                  href="/help/support"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  contacter le support
                </a>
                .
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook pour utiliser ErrorBoundary dans les composants fonctionnels
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Composant wrapper pour ErrorBoundary avec styles par défaut
 */
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

