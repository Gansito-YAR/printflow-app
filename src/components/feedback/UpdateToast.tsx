// UpdateToast — banner inferior "Actualización crítica requerida".
// Constitution Principle IV: sin color.
// Fase 1.5: fondo --ink-strong, texto --surface-0 (según spec §7.4.4).
// Position fixed encima del BottomNav para que sea visible.

interface UpdateToastProps {
  onUpdate: () => void;
  visible: boolean;
}

export function UpdateToast({ onUpdate, visible }: UpdateToastProps) {
  if (!visible) return null;
  return (
    <div
      data-testid="update-toast"
      onClick={onUpdate}
      style={{
        position: "fixed",
        bottom: "var(--bottom-nav-height)",
        left: 0,
        right: 0,
        backgroundColor: "var(--ink-strong)",
        color: "var(--surface-0)",
        borderTop: "2px solid var(--border-strong)",
        padding: "16px",
        textAlign: "center",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        zIndex: 200,
      }}
    >
      Actualización crítica requerida. Presione aquí para reiniciar
    </div>
  );
}
