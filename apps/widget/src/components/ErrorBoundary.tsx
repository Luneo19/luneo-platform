import React from 'react';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Luneo Widget runtime error:', error, errorInfo);
    }

    this.props.onError?.(error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="luneo-widget-error p-6 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold mb-2 text-red-900">Une erreur est survenue</p>
          <p className="mb-4 text-red-700">
            {this.state.error?.message ?? 'Le widget ne peut pas être affiché pour le moment. Veuillez rafraîchir la page.'}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
