// ValidationUnavailablePanel — DENY_INDETERMINATE (saldo desconocido, negativo o lectura vencida).
// FR-002: NO se renderiza el botón de entrega aquí.
// A.2: reason="expired" para lectura vencida, con "Revalidar" (nueva lectura del
// servidor que vuelve a pasar por evaluateDeliveryGuard con su propio readAt).
// Rediseño 1.2.0: encabezado de estado y acciones apiladas.

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, RefreshCw, ScanLine, TimerReset } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { StatusHero } from "../../components/ui/StatusHero";
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

  const message =
    reason === "expired"
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
    <div data-testid="validation-unavailable-panel" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "16px" }}>
      <StatusHero
        tone="warning"
        icon={reason === "expired" ? TimerReset : AlertTriangle}
        kicker="VALIDACIÓN NO DISPONIBLE"
        title={reason === "expired" ? "La lectura caducó" : "No se pudo verificar el saldo"}
        description={message}
      />
      {failed && (
        <p
          role="alert"
          data-testid="revalidate-error"
          style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--state-blocked-ink)" }}
        >
          <AlertCircle size={18} aria-hidden="true" />
          No se pudo revalidar. Revise la conexión e intente de nuevo.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {canRevalidate && (
          <Button
            fullWidth
            loading={revalidating}
            onClick={handleRevalidate}
            data-testid="button-revalidate"
            icon={<RefreshCw size={20} aria-hidden="true" />}
          >
            {revalidating ? "Revalidando…" : "Revalidar"}
          </Button>
        )}
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate("/escanear")}
          data-testid="button-rescan"
          icon={<ScanLine size={20} aria-hidden="true" />}
        >
          Volver a escanear
        </Button>
      </div>
    </div>
  );
}
