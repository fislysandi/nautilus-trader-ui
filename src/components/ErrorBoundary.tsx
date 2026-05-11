import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px',
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '24px', fontSize: '14px' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                border: 'none', borderRadius: '8px',
                padding: '10px 24px', fontSize: '14px',
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;