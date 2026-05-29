import React, { Component } from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: 40, color: '#EDE8DC', background: '#1e2435', textAlign: 'center' }}>
          <h3>渲染错误</h3>
          <pre style={{ color: '#C4A4A4', fontSize: 11, marginTop: 12, textAlign: 'left', maxHeight: 200, overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
