// DeliveryResultScreen — decide qué panel montar basado en GuardDecision.
// Constitution Principle I: switch con casos explícitos. El componente no se instancia si no es ALLOW.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
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
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ScannedOrderDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [readAt, setReadAt] = useState<string>("");

  // A.2: Re-evaluar el guard periódicamente para que la ventana de lectura viva
  // (READ_FRESHNESS_MS = 60s) se aplique realmente con el paso del tiempo.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

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
      } else if (outcome.kind === "NETWORK_ERROR") {
        setNetworkError(true);
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

  if (networkError) {
    return (
      <div data-testid="scan-network-error" style={{ padding: "24px 16px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", border: "2px solid var(--state-warning-border)", backgroundColor: "var(--state-warning-bg)", color: "var(--state-warning-ink)" }}>
        <p style={{ fontWeight: 600, marginBottom: "16px" }}>Sin conexión al validar. Intente de nuevo.</p>
        <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-retry-scan">
          Reintentar
        </Button>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div data-testid="qr-not-recognized" style={{ padding: "24px 16px", textAlign: "center", border: "2px solid var(--state-blocked-border)", backgroundColor: "var(--state-blocked-bg)", color: "var(--state-blocked-ink)" }}>
        <p style={{ fontWeight: 600, marginBottom: "16px" }}>Código QR no reconocido</p>
      </div>
    );
  }

  // Evaluar el candado
  const nowIso = new Date().toISOString();
  const decision: GuardDecision = evaluateDeliveryGuard({
    session,
    isOnline,
    order,
    readAt,
    now: nowIso,
  });

  // Detectar si el DENY_INDETERMINATE es por lectura vencida (más de 60s)
  const readAgeMs = new Date(nowIso).getTime() - new Date(readAt).getTime();
  const isReadExpired = readAgeMs > 60_000;

  // Switch con casos explícitos — el componente no se instancia si no corresponde
  switch (decision) {
    case "ALLOW":
      return <ClearancePanel order={order} />;
    case "DENY_DEBT":
      return <BlockedDeliveryPanel order={order} orderToken={orderToken} onRevalidate={handleRevalidate} />;
    case "DENY_INDETERMINATE":
      return <ValidationUnavailablePanel reason={isReadExpired ? "expired" : "generic"} />;
    case "DENY_NOT_DELIVERABLE":
      return <NotDeliverablePanel />;
    default:
      return <ValidationUnavailablePanel reason="generic" />;
  }
}
