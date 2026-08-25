// UpdateToast — banner inferior "Actualización crítica requerida".
// Constitution Principle IV: sin color.

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
        backgroundColor: "var(--surface-1)",
        borderTop: "2px solid var(--border-strong)",
        padding: "16px",
        textAlign: "center",
        fontSize: "14px",
        color: "var(--ink-strong)",
        cursor: "pointer",
      }}
      onClick={onUpdate}
    >
      Actualización crítica requerida. Presione aquí para reiniciar
    </div>
  );
}
