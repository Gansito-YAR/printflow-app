// ConnectionIndicator — EN LÍNEA / SIN CONEXIÓN.
// Constitution Principle IV: sin color, círculo sólido vs hueco.
// Fase 1.5: respeta interruptor de demo.

import { useSessionStore } from "../../store/session";

export function ConnectionIndicator() {
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  return (
    <span
      data-testid="connection-indicator"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--ink-muted)",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          border: isOnline ? "none" : "1px solid var(--ink-muted)",
          backgroundColor: isOnline ? "var(--ink-strong)" : "transparent",
        }}
      />
      {isOnline ? "EN LÍNEA" : "SIN CONEXIÓN"}
    </span>
  );
}
