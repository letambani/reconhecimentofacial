import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("RootErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
          <h1 className="text-xl font-semibold text-red-400">Algo deu errado</h1>
          <p className="mt-2 text-sm text-slate-300">
            O app encontrou um erro ao executar. Abra o console do navegador (F12) para mais detalhes.
          </p>
          <pre className="mt-4 max-h-[50vh] overflow-auto rounded-md bg-black/40 p-4 text-xs text-amber-200">
            {this.state.error.message}
            {this.state.error.stack ? `\n\n${this.state.error.stack}` : ""}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
