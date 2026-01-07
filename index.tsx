import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Starting VaxInsight application...");

// Error Boundary to catch React render errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#dc2626' }}>Something went wrong.</h1>
          <p>The application crashed while rendering.</p>
          <pre style={{ background: '#f1f5f9', padding: 20, borderRadius: 8, overflow: 'auto', border: '1px solid #cbd5e1' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => {
                localStorage.clear(); 
                window.location.reload();
            }}
            style={{ marginTop: 20, padding: '10px 20px', background: '#334155', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Clear Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log("Application mounted successfully.");
} catch (error) {
  console.error("Failed to mount application:", error);
  rootElement.innerHTML = `<div style="color:red; padding: 20px;">Failed to mount React application. check console.</div>`;
}
