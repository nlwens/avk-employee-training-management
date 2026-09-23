import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Render prop called when an error is caught. Receives the error and a reset function. */
  fallback: (error: unknown, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: unknown;
  hasError: boolean;
}

/**
 * A generic React error boundary. It must be a class component, as React only
 * supports `getDerivedStateFromError`/`componentDidCatch` on class components.
 *
 * Use `QueryBoundary` in application code; this class is a low-level handler
 * used together with `Suspense` and `QueryErrorResetBoundary`.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error, hasError: true };
  }

  reset = () => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error, this.reset);
    }

    return this.props.children;
  }
}
