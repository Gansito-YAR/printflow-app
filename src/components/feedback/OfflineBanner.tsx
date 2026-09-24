// OfflineBanner — banner superior "SIN CONEXIÓN".
// Constitution Principle IV: sin color.
// Fase 1.5: respeta interruptor de demo.

import { useSessionStore } from "../../store/session";

export function OfflineBanner() {
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  if (isOnline) return null;
  return (
    <div
      data-testid="offline-banner"
      style={{
        backgroundColor: "var(--state-warning-bg)",
        color: "var(--state-warning-ink)",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      SIN CONEXIÓN
    </div>
  );
}
