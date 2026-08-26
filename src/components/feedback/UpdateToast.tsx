// UpdateToast — banner inferior "Actualización crítica requerida".
// Constitution Principle IV: sin color.
// Fase 1.5: fondo --ink-strong, texto --surface-0 (según spec §7.4.4).

interface UpdateToastProps {
  onUpdate: () => void;
  visible: boolean;
}

export function UpdateToast({ onUpdate, visible }: UpdateToastProps) {
  if (!visible) return null;
  return (
    <div
      data-testid="update-toast"
      style={{
        backgroundColor: "var(--ink-strong)",
        color: "var(--surface-0)",
        borderTop: "2px solid var(--border-strong)",
        padding: "16px",
        textAlign: "center",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
      }}
      onClick={onUpdate}
    >
      Actualización crítica requerida. Presione aquí para reiniciar
    </div>
  );
}
