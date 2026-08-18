import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AI Fitness OS Uncaught Rendering Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      window.location.hash = '';
      window.localStorage.setItem('ai_fitness_os_active_tab', 'home');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          id="global-error-boundary"
          className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0c0c]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.12)]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Error Headlines */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Something went wrong
              </h2>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                An unexpected interface error occurred. Your personal data is safe and preserved in local storage.
              </p>
            </div>

            {/* Technical Detail Collapsible (if available) */}
            {this.state.error && (
              <div className="text-left bg-black/40 border border-white/5 rounded-xl p-3.5 text-xs font-mono text-neutral-300 max-h-32 overflow-y-auto break-all">
                <span className="text-amber-400 font-semibold">Error:</span>{' '}
                {this.state.error.message || 'Unknown render exception'}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="btn-error-reset"
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors shadow-lg active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                Try Again
              </button>

              <button
                id="btn-error-dashboard"
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/10 transition-colors active:scale-95"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </button>

              <button
                id="btn-error-reload"
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-sm transition-colors"
                title="Reload page"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

