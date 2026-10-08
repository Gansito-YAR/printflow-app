// DeliveryResultScreen — decide qué panel montar basado en GuardDecision.
// Constitution Principle I: switch con casos explícitos. El componente no se instancia si no es ALLOW.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { StatusHero } from "../../components/ui/StatusHero";
import { QrCode, RefreshCw, ScanLine, WifiOff } from "lucide-react";
import { gateway } from "../../data";
import { useSessionStore, usableSession } from "../../store/session";
import { evaluateDeliveryGuard } from "./deliveryGuard";
import { ClearancePanel } from "./ClearancePanel";
import { BlockedDeliveryPanel } from "./BlockedDeliveryPanel";
import { ValidationUnavailablePanel } from "./ValidationUnavailablePanel";
import { NotDeliverablePanel } from "./NotDeliverablePanel";
import type { ScannedOrderDTO, GuardDecision } from "../../data/contracts";

export function DeliveryResultScreen() {
  const { orderToken = "" } = useParams();
  const navigate = useNavigate();
  // Si el servidor revocó la sesión, el candado no tiene sesión utilizable (DENY).
  const session = useSessionStore(usableSession);
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
      let outcome: Awaited<ReturnType<typeof gateway.scanOrder>>;
      try {
        outcome = await gateway.scanOrder(orderToken);
      } catch {
        // Sesión revocada (el modal ya se muestra) o fallo inesperado: nunca se autoriza.
        outcome = { kind: "NETWORK_ERROR" };
      }
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
    // Esqueleto con la forma del resultado (no un spinner suelto).
    return (
      <div data-testid="delivery-loading" aria-busy="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "24px" }}>
        <span className="skeleton-pulse" style={{ width: "72px", height: "72px", borderRadius: "var(--radius-full)", backgroundColor: "var(--surface-2)" }} />
        <span className="skeleton-pulse" style={{ width: "160px", height: "14px", borderRadius: "7px", backgroundColor: "var(--surface-2)" }} />
        <span className="skeleton-pulse" style={{ width: "220px", height: "22px", borderRadius: "8px", backgroundColor: "var(--surface-2)" }} />
        <div className="pf-card skeleton-pulse" style={{ width: "100%", height: "150px", marginTop: "8px" }} />
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--ink-muted)" }}>
          <Spinner size="sm" /> Validando con el servidor…
        </span>
      </div>
    );
  }

  if (networkError) {
    return (
      <div data-testid="scan-network-error" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "16px" }}>
        <StatusHero
          tone="warning"
          icon={WifiOff}
          kicker="SIN CONEXIÓN"
          title="No se pudo validar"
          description="Sin conexión al validar. Intente de nuevo."
        />
        <Button fullWidth onClick={() => navigate("/escanear")} data-testid="button-retry-scan" icon={<RefreshCw size={20} aria-hidden="true" />}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div data-testid="qr-not-recognized" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "16px" }}>
        <StatusHero
          tone="blocked"
          icon={QrCode}
          kicker="NO RECONOCIDO"
          title="Código QR no reconocido"
          description="El código no corresponde a ninguna remisión. Verifique que sea el QR de la nota de remisión."
        />
        <Button variant="secondary" fullWidth onClick={() => navigate("/escanear")} data-testid="button-rescan" icon={<ScanLine size={20} aria-hidden="true" />}>
          Volver a escanear
        </Button>
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
      return isReadExpired ? (
        <ValidationUnavailablePanel reason="expired" orderToken={orderToken} onRevalidate={handleRevalidate} />
      ) : (
        <ValidationUnavailablePanel reason="generic" />
      );
    case "DENY_NOT_DELIVERABLE":
      return <NotDeliverablePanel status={order.status} />;
    default:
      return <ValidationUnavailablePanel reason="generic" />;
  }
}
