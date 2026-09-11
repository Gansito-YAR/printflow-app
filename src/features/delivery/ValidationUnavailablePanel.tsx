// ValidationUnavailablePanel — DENY_INDETERMINATE (balanceDue null o negativo).
// FR-002: NO se renderiza el botón de entrega aquí.
// A.2: reason="expired" muestra mensaje propio para lectura vencida.

import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";

interface Props {
  reason?: "generic" | "expired";
}

export function ValidationUnavailablePanel({ reason = "generic" }: Props) {
  const navigate = useNavigate();
  const message = reason === "expired"
    ? "La validación caducó por seguridad. Vuelva a escanear el código."
    : "No se pudo verificar el saldo del pedido. Contacte a soporte.";
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
        {message}
      </p>
      <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-rescan">
        Volver a escanear
      </Button>
    </div>
  );
}
