// NotDeliverablePanel — DENY_NOT_DELIVERABLE (status no es READY_FOR_DELIVERY).
// FR-002: NO se renderiza el botón de entrega aquí.

import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import type { OrderStatus } from "../../data/contracts";

/** APP-D-14: el instalador necesita saber qué decirle al cliente. */
const REASON: Partial<Record<OrderStatus, { title: string; detail: string }>> = {
  PENDING_DEPOSIT: { title: "Pedido sin anticipo", detail: "El cliente aún no paga el anticipo; el trabajo no se produjo. No entregar." },
  IN_PRODUCTION: { title: "Pedido todavía en taller", detail: "Aún no está listo para entrega. No entregar." },
  DELIVERED: { title: "Este pedido ya fue entregado", detail: "La entrega ya está registrada en el sistema." },
  CANCELLED: { title: "PEDIDO CANCELADO", detail: "Este pedido fue cancelado. No entregar." },
};

export function NotDeliverablePanel({ status }: { status?: OrderStatus }) {
  const reason = status ? REASON[status] : undefined;
  const navigate = useNavigate();
  return (
    <div
      data-testid="not-deliverable-panel"
      style={{
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: "1px solid var(--state-neutral-border)",
        backgroundColor: "var(--state-neutral-bg)",
      }}
    >
      <p style={{ fontSize: "16px", fontWeight: 600 }} data-testid="not-deliverable-title">
        {reason?.title ?? "Este pedido no está listo para entrega"}
      </p>
      {reason && (
        <p style={{ fontSize: "14px", color: "var(--ink-base)" }} data-testid="not-deliverable-detail">
          {reason.detail}
        </p>
      )}
      <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-rescan">
        Volver a escanear
      </Button>
    </div>
  );
}
