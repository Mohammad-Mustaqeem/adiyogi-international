import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="min-h-screen flex items-center justify-center bg-ivory">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="font-display font-bold text-2xl text-navy-800 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                {this.state.error?.message}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-primary"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
