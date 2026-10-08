// UpdateToast — aviso de actualización requerida.
// Rediseño 1.2.0: tarjeta flotante sobre la navegación inferior, con icono y
// botón explícito (no toda la barra como zona táctil invisible).

import { RefreshCw } from "lucide-react";

interface UpdateToastProps {
  onUpdate: () => void;
  visible: boolean;
}

export function UpdateToast({ onUpdate, visible }: UpdateToastProps) {
  if (!visible) return null;
  return (
    <div
      data-testid="update-toast"
      role="alert"
      onClick={onUpdate}
      className="pf-enter"
      style={{
        position: "fixed",
        left: "12px",
        right: "12px",
        bottom: "calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 12px)",
        maxWidth: "536px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 12px 12px 16px",
        borderRadius: "var(--radius-xl)",
        backgroundColor: "var(--ink-strong)",
        color: "var(--surface-0)",
        boxShadow: "var(--shadow-float)",
        cursor: "pointer",
        zIndex: 200,
      }}
    >
      <RefreshCw size={20} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: "14px", fontWeight: 600, lineHeight: 1.35 }}>
        Actualización crítica requerida. Presione aquí para reiniciar
      </span>
      <span
        style={{
          padding: "8px 14px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--brand-bg)",
          color: "var(--brand-ink)",
          fontSize: "14px",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        Reiniciar
      </span>
    </div>
  );
}
