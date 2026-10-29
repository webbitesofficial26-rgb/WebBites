import React from "react";

/** Provides a visible recovery screen when a page or lazy-loaded component crashes. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Keep diagnostics available during development without exposing details to users.
    console.error("WebBites page rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <section className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-gray-600">
              This page could not be displayed. You can try again or return to the home page.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Try again
              </button>
              <a
                href="/"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go home
              </a>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
