// DeliveryResultScreen — decide qué panel montar basado en GuardDecision.
// Constitution Principle I: switch con casos explícitos. El componente no se instancia si no es ALLOW.

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { gateway } from "../../data/mocks/mockGateway";
import { useSessionStore } from "../../store/session";
import { evaluateDeliveryGuard } from "./deliveryGuard";
import { ClearancePanel } from "./ClearancePanel";
import { BlockedDeliveryPanel } from "./BlockedDeliveryPanel";
import { ValidationUnavailablePanel } from "./ValidationUnavailablePanel";
import { NotDeliverablePanel } from "./NotDeliverablePanel";
import type { ScannedOrderDTO, GuardDecision } from "../../data/contracts";

export function DeliveryResultScreen() {
  const { orderToken = "" } = useParams();
  const session = useSessionStore((s) => s.session);
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ScannedOrderDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [readAt, setReadAt] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const timestamp = new Date().toISOString();
      const outcome = await gateway.scanOrder(orderToken);
      if (cancelled) return;
      setReadAt(timestamp);
      if (outcome.kind === "FOUND") {
        setOrder(outcome.order);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orderToken]);

  const handleRevalidate = (newOrder: ScannedOrderDTO) => {
    setOrder(newOrder);
    setReadAt(new Date().toISOString());
  };

  if (loading) {
    return (
      <div data-testid="delivery-loading" style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div data-testid="qr-not-recognized" style={{ padding: "24px 16px", textAlign: "center" }}>
        <p style={{ fontWeight: 600, marginBottom: "16px" }}>Código QR no reconocido</p>
      </div>
    );
  }

  // Evaluar el candado
  const decision: GuardDecision = evaluateDeliveryGuard({
    session,
    isOnline,
    order,
    readAt,
    now: new Date().toISOString(),
  });

  // Switch con casos explícitos — el componente no se instancia si no corresponde
  switch (decision) {
    case "ALLOW":
      return <ClearancePanel order={order} />;
    case "DENY_DEBT":
      return <BlockedDeliveryPanel order={order} onRevalidate={handleRevalidate} />;
    case "DENY_INDETERMINATE":
      return <ValidationUnavailablePanel />;
    case "DENY_NOT_DELIVERABLE":
      return <NotDeliverablePanel />;
    default:
      return <ValidationUnavailablePanel />;
  }
}
