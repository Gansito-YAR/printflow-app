// BlockedDeliveryPanel ("Alerta Roja") — DENY_DEBT.
// FR-002: NO se renderiza el botón de entrega aquí.
// FR-028: "Revalidar saldo" reconsulta el gateway con el mismo orderToken.
// Rediseño 1.2.0: encabezado de estado, saldo destacado, acciones apiladas.

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Ban, Package, RefreshCw, ScanLine, User, Wallet } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { StatusHero } from "../../components/ui/StatusHero";
import { InfoRow } from "../../components/ui/InfoRow";
import { gateway } from "../../data";
import { useSessionStore } from "../../store/session";
import type { ScannedOrderDTO } from "../../data/contracts";

interface BlockedDeliveryPanelProps {
  order: ScannedOrderDTO;
  orderToken: string;
  onRevalidate: (order: ScannedOrderDTO) => void;
}

export function BlockedDeliveryPanel({ order, orderToken, onRevalidate }: BlockedDeliveryPanelProps) {
  const navigate = useNavigate();
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const [revalidating, setRevalidating] = useState(false);
  const [revalidateError, setRevalidateError] = useState(false);
  const inFlight = useRef(false);

  const handleRevalidate = async () => {
    if (inFlight.current) return; // un solo toque
    inFlight.current = true;
    setRevalidating(true);
    setRevalidateError(false);
    try {
      // M-01: revalidar con el token de la URL, no con order.orderToken (payload opaco).
      const outcome = await gateway.scanOrder(orderToken);
      if (outcome.kind === "FOUND") onRevalidate(outcome.order);
      else setRevalidateError(true);
    } catch {
      setRevalidateError(true);
    } finally {
      inFlight.current = false;
      setRevalidating(false);
    }
  };

  return (
    <div data-testid="blocked-delivery-panel" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "8px" }}>
      <StatusHero
        tone="blocked"
        icon={Ban}
        kicker="ENTREGA BLOQUEADA"
        title="El pedido tiene saldo pendiente"
        description="El sistema impide la entrega. Solicite la liquidación y la aprobación del cobro por el administrador."
      />

      <div className="pf-card" style={{ overflow: "hidden", borderColor: "var(--state-blocked-border)" }}>
        <InfoRow icon={User} label="Cliente">{order.customerLabel}</InfoRow>
        <InfoRow icon={Package} label="Producto" last={!order.balanceDue}>{order.productLabel}</InfoRow>
        {order.balanceDue && (
          <InfoRow icon={Wallet} label="Saldo pendiente" emphasis last>
            <span style={{ color: "var(--state-blocked-ink)" }}>${order.balanceDue}</span>
          </InfoRow>
        )}
      </div>

      {revalidateError && (
        <p
          role="alert"
          data-testid="revalidate-error"
          style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--state-blocked-ink)" }}
        >
          <AlertCircle size={18} aria-hidden="true" />
          No se pudo revalidar el saldo. Revise la conexión e intente de nuevo.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {isOnline && (
          <Button
            fullWidth
            loading={revalidating}
            onClick={handleRevalidate}
            data-testid="button-revalidate"
            icon={<RefreshCw size={20} aria-hidden="true" />}
          >
            {revalidating ? "Revalidando…" : "Revalidar saldo"}
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
