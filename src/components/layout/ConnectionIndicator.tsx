// ConnectionIndicator — EN LÍNEA / SIN CONEXIÓN.
// Rediseño 1.2.0: píldora con icono y texto (no depende del color: el icono
// cambia de Wifi a WifiOff). Respeta el interruptor de demo (Fase 1.5).

import { Wifi, WifiOff } from "lucide-react";
import { useSessionStore } from "../../store/session";

export function ConnectionIndicator() {
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const tone = isOnline ? "cleared" : "warning";
  const Icon = isOnline ? Wifi : WifiOff;
  return (
    <span
      data-testid="connection-indicator"
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        minHeight: "28px",
        borderRadius: "var(--radius-full)",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: `var(--state-${tone}-ink)`,
        backgroundColor: `var(--state-${tone}-bg)`,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
      {isOnline ? "EN LÍNEA" : "SIN CONEXIÓN"}
    </span>
  );
}
