import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center animate-fadeIn">
          <span className="material-symbols-outlined text-gray-200 mb-4" style={{ fontSize: '80px' }}>
            warning
          </span>
          <h2 className="text-xl font-bold text-gray-700 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-sm">
            มีบางอย่างผิดพลาด กรุณาโหลดหน้าใหม่
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-xs text-left bg-red-50 border border-red-200 rounded-xl p-4 max-w-full overflow-auto mb-4 text-red-700">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            โหลดใหม่
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
