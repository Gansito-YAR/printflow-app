// OfflineBanner — aviso "SIN CONEXIÓN" bajo el encabezado.
// Rediseño 1.2.0: icono + texto + explicación de qué no se puede hacer.
// Respeta el interruptor de demo (Fase 1.5).

import { WifiOff } from "lucide-react";
import { useSessionStore } from "../../store/session";

export function OfflineBanner() {
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  if (isOnline) return null;
  return (
    <div
      data-testid="offline-banner"
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        backgroundColor: "var(--state-warning-bg)",
        color: "var(--state-warning-ink)",
        borderBottom: "1px solid var(--state-warning-border)",
        padding: "10px 16px",
        fontSize: "14px",
        fontWeight: 600,
      }}
    >
      <WifiOff size={16} strokeWidth={2.5} aria-hidden="true" />
      <span>
        <strong style={{ letterSpacing: "0.04em" }}>SIN CONEXIÓN</strong> · no se pueden validar entregas
      </span>
    </div>
  );
}
