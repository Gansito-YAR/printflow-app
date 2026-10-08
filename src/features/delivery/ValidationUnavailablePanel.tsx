// ValidationUnavailablePanel — DENY_INDETERMINATE (balanceDue null o negativo).
// FR-002: NO se renderiza el botón de entrega aquí.
// A.2: reason="expired" muestra mensaje propio para lectura vencida.
// Fase 2: con la lectura vencida se ofrece "Revalidar" (nueva lectura del servidor)
// además de volver a escanear. El candado no cambia: la nueva lectura vuelve a
// pasar por evaluateDeliveryGuard con su propio readAt.

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { gateway } from "../../data";
import type { ScannedOrderDTO } from "../../data/contracts";

interface Props {
  reason?: "generic" | "expired";
  /** Solo con reason="expired": token del código leído y receptor de la nueva lectura. */
  orderToken?: string;
  onRevalidate?: (order: ScannedOrderDTO) => void;
}

export function ValidationUnavailablePanel({ reason = "generic", orderToken, onRevalidate }: Props) {
  const navigate = useNavigate();
  const [revalidating, setRevalidating] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const canRevalidate = reason === "expired" && Boolean(orderToken && onRevalidate);

  const message = reason === "expired"
    ? canRevalidate
      ? "La validación caducó por seguridad (más de 1 minuto). Revalide para consultar el saldo actual."
      : "La validación caducó por seguridad. Vuelva a escanear el código."
    : "No se pudo verificar el saldo del pedido. Contacte a soporte.";

  const handleRevalidate = async () => {
    if (inFlight.current || !orderToken || !onRevalidate) return;
    inFlight.current = true;
    setRevalidating(true);
    setFailed(false);
    try {
      const outcome = await gateway.scanOrder(orderToken);
      if (outcome.kind === "FOUND") onRevalidate(outcome.order);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setRevalidating(false);
    }
  };

  return (
    <div
      data-testid="validation-unavailable-panel"
      style={{
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: "2px solid var(--state-neutral-border)",
        backgroundColor: "var(--state-neutral-bg)",
      }}
    >
      <StatusBadge variant="error" label="VALIDACIÓN NO DISPONIBLE" />
      <p style={{ fontSize: "14px" }}>
        {message}
      </p>
      {failed && (
        <p role="alert" data-testid="revalidate-error" style={{ fontSize: "14px", color: "var(--state-blocked-ink)" }}>
          No se pudo revalidar. Revise la conexión e intente de nuevo.
        </p>
      )}
      {canRevalidate && (
        <Button fullWidth loading={revalidating} onClick={handleRevalidate} data-testid="button-revalidate">
          {revalidating ? "Revalidando…" : "Revalidar"}
        </Button>
      )}
      <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-rescan">
        Volver a escanear
      </Button>
    </div>
  );
}
