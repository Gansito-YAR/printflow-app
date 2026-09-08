// ValidationUnavailablePanel — DENY_INDETERMINATE (balanceDue null o negativo).
// FR-002: NO se renderiza el botón de entrega aquí.

import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";

export function ValidationUnavailablePanel() {
  const navigate = useNavigate();
  return (
    <div
      data-testid="validation-unavailable-panel"
      style={{
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: "2px solid var(--border-strong)",
      }}
    >
      <StatusBadge variant="error" label="VALIDACIÓN NO DISPONIBLE" />
      <p style={{ fontSize: "14px" }}>
        No se pudo verificar el saldo del pedido. Contacte a soporte.
      </p>
      <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-rescan">
        Volver a escanear
      </Button>
    </div>
  );
}
