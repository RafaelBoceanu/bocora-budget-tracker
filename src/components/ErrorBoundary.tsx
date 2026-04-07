// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('[Bocora] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100svh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center', background: '#faf8f4',
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 700, color: '#1a1714', marginBottom: 8,
        }}>
          Something went wrong
        </div>
        <div style={{ fontSize: 14, color: '#9a9088', marginBottom: 8, maxWidth: 320 }}>
          Your data is safe. Try reloading the app.
        </div>
        {this.state.message && (
          <div style={{
            fontSize: 11, color: '#b0a898', background: '#f0ede7',
            borderRadius: 8, padding: '6px 12px', marginBottom: 24,
            maxWidth: 320, wordBreak: 'break-word', fontFamily: 'monospace',
          }}>
            {this.state.message}
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none',
            background: '#2d2a26', color: '#fff', fontSize: 15, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
          }}
        >
          Reload app
        </button>
      </div>
    );
  }
}