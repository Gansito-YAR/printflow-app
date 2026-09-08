// BlockedDeliveryPanel ("Alerta Roja") — DENY_DEBT.
// FR-002: NO se renderiza el botón de entrega aquí.
// FR-028: botón "Revalidar saldo" que reconsulta el gateway con el mismo orderToken.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";

import { StatusBadge } from "../../components/ui/StatusBadge";
import { gateway } from "../../data/mocks/mockGateway";
import { useSessionStore } from "../../store/session";
import type { ScannedOrderDTO } from "../../data/contracts";

interface BlockedDeliveryPanelProps {
  order: ScannedOrderDTO;
  onRevalidate: (order: ScannedOrderDTO) => void;
}

export function BlockedDeliveryPanel({ order, onRevalidate }: BlockedDeliveryPanelProps) {
  const navigate = useNavigate();
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const [revalidating, setRevalidating] = useState(false);

  const handleRevalidate = async () => {
    setRevalidating(true);
    try {
      const outcome = await gateway.scanOrder(order.orderToken);
      if (outcome.kind === "FOUND") {
        onRevalidate(outcome.order);
      }
    } finally {
      setRevalidating(false);
    }
  };

  return (
    <div
      data-testid="blocked-delivery-panel"
      className="trama-diagonal"
      style={{
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: "4px solid var(--border-strong)",
      }}
    >
      <StatusBadge variant="blocked" label="ENTREGA BLOQUEADA" />
      <div>
        <p style={{ fontSize: "14px", color: "var(--ink-muted)" }}>Cliente</p>
        <p style={{ fontSize: "16px", fontWeight: 600 }}>{order.customerLabel}</p>
      </div>
      <div>
        <p style={{ fontSize: "14px", color: "var(--ink-muted)" }}>Producto</p>
        <p style={{ fontSize: "16px", fontWeight: 600 }}>{order.productLabel}</p>
      </div>
      {order.balanceDue && (
        <div>
          <p style={{ fontSize: "14px", color: "var(--ink-muted)" }}>Saldo pendiente</p>
          <p style={{ fontSize: "18px", fontWeight: 700 }}>${order.balanceDue}</p>
        </div>
      )}
      <p style={{ fontSize: "14px" }}>
        El sistema impide la entrega. Solicite la liquidación y la aprobación del cobro por el administrador.
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-rescan">
          Volver a escanear
        </Button>
        {isOnline && (
          <Button
            fullWidth
            loading={revalidating}
            onClick={handleRevalidate}
            data-testid="button-revalidate"
          >
            {revalidating ? "Revalidando…" : "Revalidar saldo"}
          </Button>
        )}
      </div>
    </div>
  );
}
