import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', padding: 40, fontFamily: 'monospace' }}>
          <h2 style={{ color: '#f87171', marginBottom: 16 }}>Something went wrong</h2>
          <pre style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#fca5a5', fontSize: 13 }}>
            {err.message}{'\n\n'}{err.stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); localStorage.removeItem('token'); window.location.reload(); }}
            style={{ marginTop: 24, padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear session &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
