// NotDeliverablePanel — DENY_NOT_DELIVERABLE (status no es READY_FOR_DELIVERY).
// FR-002: NO se renderiza el botón de entrega aquí.
// APP-D-14: motivo concreto según el estado.
// Rediseño 1.2.0: encabezado de estado con icono por motivo.

import { useNavigate } from "react-router-dom";
import { Ban, CircleDollarSign, Factory, PackageCheck, PackageX, ScanLine, type LucideIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { StatusHero, type HeroTone } from "../../components/ui/StatusHero";
import type { OrderStatus } from "../../data/contracts";

/** APP-D-14: el instalador necesita saber qué decirle al cliente. */
const REASON: Partial<Record<OrderStatus, { title: string; detail: string; tone: HeroTone; icon: LucideIcon; kicker: string }>> = {
  PENDING_DEPOSIT: {
    kicker: "NO ENTREGAR",
    title: "Pedido sin anticipo",
    detail: "El cliente aún no paga el anticipo; el trabajo no se produjo. No entregar.",
    tone: "warning",
    icon: CircleDollarSign,
  },
  IN_PRODUCTION: {
    kicker: "NO ENTREGAR",
    title: "Pedido todavía en taller",
    detail: "Aún no está listo para entrega. No entregar.",
    tone: "warning",
    icon: Factory,
  },
  DELIVERED: {
    kicker: "YA ENTREGADO",
    title: "Este pedido ya fue entregado",
    detail: "La entrega ya está registrada en el sistema.",
    tone: "neutral",
    icon: PackageCheck,
  },
  CANCELLED: {
    kicker: "NO ENTREGAR",
    title: "PEDIDO CANCELADO",
    detail: "Este pedido fue cancelado. No entregar.",
    tone: "blocked",
    icon: Ban,
  },
};

export function NotDeliverablePanel({ status }: { status?: OrderStatus }) {
  const navigate = useNavigate();
  const reason = status ? REASON[status] : undefined;
  return (
    <div data-testid="not-deliverable-panel" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "16px" }}>
      <StatusHero
        tone={reason?.tone ?? "neutral"}
        icon={reason?.icon ?? PackageX}
        kicker={reason?.kicker ?? "NO ENTREGABLE"}
        title={reason?.title ?? "Este pedido no está listo para entrega"}
        description={reason?.detail}
        titleTestId="not-deliverable-title"
        descriptionTestId={reason ? "not-deliverable-detail" : undefined}
      />
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
  );
}
