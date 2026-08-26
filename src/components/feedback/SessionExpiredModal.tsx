// SessionExpiredModal — modal bloqueante cuando la sesión expira.
// FR-026: Modal bloqueante "Sesión expirada" con botón que redirige a login.

import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../../store/session";
import { useDemoStore } from "../../store/demo";

export function SessionExpiredModal() {
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const logout = useSessionStore((s) => s.logout);

  if (!session) return null;

  const now = new Date();
  const deadline = new Date(session.absoluteDeadline);
  const isExpired = now >= deadline;

  if (!isExpired) return null;

  const handleGoToLogin = () => {
    // Desactivar el interruptor de sesión vencida del demo
    // para que el próximo login no dispare el modal de nuevo
    useDemoStore.getState().setSessionExpired(false);
    logout();
    navigate("/login");
  };

  return (
    <div
      data-testid="session-expired-modal"
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      {/* Backdrop semitransparente — separado del modal para no afectarlo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "var(--overlay-backdrop)",
          opacity: 0.5,
        }}
      />
      {/* Modal content — opaco, encima del backdrop */}
      <div
        style={{
          position: "relative",
          backgroundColor: "var(--surface-0)",
          border: "2px solid var(--border-strong)",
          padding: "32px 24px",
          maxWidth: "320px",
          width: "90%",
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>
          Sesión expirada
        </p>
        <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "24px" }}>
          Su sesión ha expirado. Inicie sesión nuevamente para continuar.
        </p>
        <button
          data-testid="session-expired-go-login"
          onClick={handleGoToLogin}
          style={{
            height: "56px",
            minHeight: "var(--hitbox-min)",
            width: "100%",
            backgroundColor: "var(--ink-strong)",
            color: "var(--surface-0)",
            border: "2px solid var(--ink-strong)",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ir a login
        </button>
      </div>
    </div>
  );
}
