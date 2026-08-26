// ClearancePanel ("Alerta Verde") — solo se renderiza si ALLOW.
// FR-002: el botón "Confirmar entrega física" vive aquí. Si este panel no se monta, el botón no existe.
// FR-009: hitbox >=60x60px, alto visual 64px.
// FR-025: disable on first tap, spinner, una sola mutación.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";

import { StatusBadge } from "../../components/ui/StatusBadge";
import { gateway } from "../../data/mocks/mockGateway";
import type { ScannedOrderDTO, ConfirmDeliveryResult } from "../../data/contracts";

interface ClearancePanelProps {
  order: ScannedOrderDTO;
}

export function ClearancePanel({ order }: ClearancePanelProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "already-registered">("idle");
  const [result, setResult] = useState<ConfirmDeliveryResult | null>(null);

  const handleConfirm = async () => {
    if (state === "loading") return; // una sola mutación
    setState("loading");
    try {
      const res = await gateway.confirmDelivery(order.orderToken);
      setResult(res);
      if (res.ok) {
        setState("success");
      } else if (res.reason.includes("ya había sido registrada")) {
        setState("already-registered");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  if (state === "success" && result?.ok) {
    return (
      <div
        data-testid="delivery-success"
        style={{ padding: "24px 16px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <StatusBadge variant="authorized" label="ENTREGA REGISTRADA" />
        <p style={{ fontSize: "14px", color: "var(--ink-muted)" }}>
          {new Date(result.deliveredAt).toLocaleString("es-MX")}
        </p>
        <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-scan-another">
          Escanear otro
        </Button>
      </div>
    );
  }

  if (state === "already-registered") {
    return (
      <div
        data-testid="delivery-already-registered"
        style={{ padding: "24px 16px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <p style={{ fontSize: "16px", fontWeight: 600 }}>La entrega ya había sido registrada</p>
        <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-scan-another">
          Escanear otro
        </Button>
      </div>
    );
  }

  return (
    <div
      data-testid="clearance-panel"
      style={{
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: "4px double var(--border-strong)",
      }}
    >
      <StatusBadge variant="authorized" label="AUTORIZADO PARA ENTREGA" />
      <div>
        <p style={{ fontSize: "14px", color: "var(--ink-muted)" }}>Cliente</p>
        <p style={{ fontSize: "16px", fontWeight: 600 }}>{order.customerLabel}</p>
      </div>
      <div>
        <p style={{ fontSize: "14px", color: "var(--ink-muted)" }}>Producto</p>
        <p style={{ fontSize: "16px", fontWeight: 600 }}>{order.productLabel}</p>
      </div>
      <p style={{ fontSize: "14px", fontWeight: 600 }}>PAGO CONFIRMADO. Saldo: $0.00</p>
      {state === "error" && (
        <p
          role="alert"
          data-testid="delivery-error"
          style={{ fontSize: "14px", padding: "8px", border: "2px solid var(--border-strong)" }}
        >
          No se pudo confirmar la entrega. Reconsulte el estado.
        </p>
      )}
      <Button
        fullWidth
        loading={state === "loading"}
        error={state === "error"}
        onClick={handleConfirm}
        data-testid="delivery-confirm"
      >
        {state === "loading" ? "Confirmando entrega…" : "Confirmar entrega física"}
      </Button>
    </div>
  );
}
