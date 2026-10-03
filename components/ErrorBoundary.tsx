/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error securely without exposing sensitive internals
    console.error('Application Error Boundary caught an exception:', error.message);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('kodavalam_game_save_v1');
    } catch {
      // Ignore storage errors during recovery
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-[#061912] text-stone-100 flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-stone-900/90 border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-3xl shadow-inner">
              🌴
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif-title text-amber-300">
                Kodavalam Simulator
              </h1>
              <p className="text-xs text-stone-400 mt-1">
                A display or 3D rendering context reset occurred. The application has safely contained the event.
              </p>
            </div>

            <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow active:scale-95 transition-all"
              >
                🔄 Resume Simulation
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl border border-stone-700 active:scale-95 transition-all"
              >
                ⚙️ Reset Village State
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
