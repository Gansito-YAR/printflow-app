// NotDeliverablePanel — DENY_NOT_DELIVERABLE (status no es READY_FOR_DELIVERY).
// FR-002: NO se renderiza el botón de entrega aquí.

import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function NotDeliverablePanel() {
  const navigate = useNavigate();
  return (
    <div
      data-testid="not-deliverable-panel"
      style={{
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: "1px solid var(--border-hairline)",
      }}
    >
      <p style={{ fontSize: "16px", fontWeight: 600 }}>Este pedido no está listo para entrega</p>
      <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-rescan">
        Volver a escanear
      </Button>
    </div>
  );
}
