// SessionExpiredModal — modal bloqueante cuando la sesión termina.
// FR-026: botón que redirige al login. A.3: no importa nada de demo.
// Fase 2 (APP-03d): dos motivos — turno de 12 h vencido o sesión cerrada por el servidor.
// Rediseño 1.2.0: tarjeta con icono, velo al 50 % y animación de entrada.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, TimerOff } from "lucide-react";
import { useSessionStore } from "../../store/session";

export function SessionExpiredModal() {
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const revokedReason = useSessionStore((s) => s.revokedReason);
  const logout = useSessionStore((s) => s.logout);

  // M-03: el tick vive dentro del modal, no en AppShell (evita remontar la app cada segundo).
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!session) return null;

  const isExpired = new Date() >= new Date(session.absoluteDeadline);
  // Dos motivos: el reloj del turno (12 h) o el servidor cerró la sesión.
  if (!isExpired && !revokedReason) return null;
  const revoked = revokedReason === "REVOKED" && !isExpired;
  const Icon = revoked ? LockKeyhole : TimerOff;

  const handleGoToLogin = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      data-testid="session-expired-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 1000,
      }}
    >
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, backgroundColor: "var(--overlay-backdrop)", opacity: 0.55 }}
      />
      <div
        className="pf-card pf-enter"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "360px",
          padding: "28px 24px 24px",
          textAlign: "center",
          boxShadow: "var(--shadow-float)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-full)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--state-warning-bg)",
            color: "var(--state-warning-ink)",
            border: "2px solid var(--state-warning-border)",
          }}
        >
          <Icon size={30} />
        </span>
        <p id="session-expired-title" style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--ink-strong)" }}>
          {revoked ? "Sesión cerrada" : "Sesión expirada"}
        </p>
        <p
          style={{ fontSize: "15px", color: "var(--ink-base)", margin: 0, lineHeight: 1.5 }}
          data-testid="session-expired-reason"
        >
          {revoked
            ? "El sistema cerró su sesión (turno terminado o cuenta desactivada). Inicie sesión nuevamente."
            : "Su turno de 12 horas terminó. Inicie sesión nuevamente para continuar."}
        </p>
        <button
          data-testid="session-expired-go-login"
          onClick={handleGoToLogin}
          className="pf-pressable"
          style={{
            marginTop: "8px",
            height: "56px",
            width: "100%",
            backgroundColor: "var(--action-primary-bg)",
            color: "var(--action-primary-ink)",
            border: "none",
            borderRadius: "14px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Ir a login
        </button>
      </div>
    </div>
  );
}
