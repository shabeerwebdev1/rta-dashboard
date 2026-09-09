import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled application error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <section>
          <h1>Application unavailable</h1>
          <p>Please reload the page. If the problem continues, contact support.</p>
          {this.state.errorMessage && <details>{this.state.errorMessage}</details>}
          <button type="button" onClick={this.handleReload} style={{ marginTop: 16 }}>
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
