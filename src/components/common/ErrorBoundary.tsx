import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unexpected runtime error',
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    // Keep console diagnostics for local debugging.
    console.error('Unhandled UI error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetView = () => {
    this.setState({
      hasError: false,
      errorMessage: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="apple-bg-main flex min-h-screen items-center justify-center px-4 text-slate-100">
          <div className="liquid-glass-panel w-full max-w-lg rounded-[28px] p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-rose-300">Application Error</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Qualcosa è andato storto</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Abbiamo intercettato un errore runtime per evitare il crash completo dell&apos;app.
            </p>
            {this.state.errorMessage ? (
              <div className="liquid-glass-card mt-4 px-3 py-2 text-xs text-slate-300">
                {this.state.errorMessage}
              </div>
            ) : null}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={this.handleResetView}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-white/[0.08]"
              >
                Riprova vista
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-2xl border border-sky-400/30 bg-sky-400/15 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/25"
              >
                Ricarica app
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
