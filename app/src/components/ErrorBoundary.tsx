import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError)
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-5 px-6 text-white">
          <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-4xl">
            ⚠️
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black">Something went wrong</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              {this.state.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      );
    return this.props.children;
  }
}
