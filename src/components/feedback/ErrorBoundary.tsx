// ErrorBoundary — global. Nunca pantalla en blanco.
// Constitution Principle VI: ErrorBoundary global obligatorio.

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-boundary"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "32px 16px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
            Ocurrió un error. Reinicie la aplicación e informe a Sistemas
          </p>
          <button
            data-testid="error-reload"
            onClick={this.handleReload}
            style={{
              height: "56px",
              minHeight: "var(--hitbox-min)",
              padding: "0 24px",
              backgroundColor: "var(--ink-strong)",
              color: "var(--surface-0)",
              border: "2px solid var(--ink-strong)",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recargar aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
