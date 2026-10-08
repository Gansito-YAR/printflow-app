// ClearancePanel ("Alerta Verde") — solo se renderiza si ALLOW.
// FR-002: el botón "Confirmar entrega física" vive aquí. Si este panel no se monta, el botón no existe.
// FR-009: hitbox >= 60 px, alto visual 64 px (Button size="xl").
// FR-025: guarda síncrona, spinner, una sola mutación. APP-D-12: reintento seguro.
// Rediseño 1.2.0: encabezado de estado, detalle en tarjeta, acción principal única.

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BadgeCheck, CheckCircle2, Package, PackageCheck, ScanLine, ShieldCheck, User, Wallet } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { StatusHero } from "../../components/ui/StatusHero";
import { InfoRow } from "../../components/ui/InfoRow";
import { gateway } from "../../data";
import type { ScannedOrderDTO, ConfirmDeliveryResult } from "../../data/contracts";

interface ClearancePanelProps {
  order: ScannedOrderDTO;
}

export function ClearancePanel({ order }: ClearancePanelProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "already-registered">("idle");
  const [result, setResult] = useState<ConfirmDeliveryResult | null>(null);
  // Guarda síncrona: dos toques en el mismo instante = una sola mutación.
  const inFlight = useRef(false);
  // APP-D-12: si un intento falló por red, un ALREADY_DELIVERED posterior significa
  // que el primero sí llegó al servidor: es un éxito, no un error.
  const hadNetworkFailure = useRef(false);
  const [networkFailed, setNetworkFailed] = useState(false);

  const handleConfirm = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState("loading");
    try {
      const res = await gateway.confirmDelivery(order.orderToken);
      setResult(res);
      if (res.ok) {
        setState("success");
      } else if (res.code === "ALREADY_DELIVERED") {
        setState(hadNetworkFailure.current ? "success" : "already-registered");
      } else {
        setState("error");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "NETWORK_ERROR") {
        hadNetworkFailure.current = true;
        setNetworkFailed(true);
      }
      setState("error");
    } finally {
      inFlight.current = false;
    }
  };

  const scanAnother = (
    <Button
      variant="secondary"
      fullWidth
      onClick={() => navigate("/escanear")}
      data-testid="button-scan-another"
      icon={<ScanLine size={20} aria-hidden="true" />}
    >
      Escanear otro
    </Button>
  );

  if (state === "success") {
    return (
      <div data-testid="delivery-success" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "16px" }}>
        <StatusHero
          tone="cleared"
          icon={BadgeCheck}
          kicker="ENTREGA REGISTRADA"
          title="¡Entrega completada!"
          description={
            result?.ok
              ? `Registrada el ${new Date(result.deliveredAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}.`
              : "La entrega quedó registrada."
          }
        />
        <div className="pf-card" style={{ overflow: "hidden" }}>
          <InfoRow icon={User} label="Cliente">{order.customerLabel}</InfoRow>
          <InfoRow icon={Package} label="Producto" last>{order.productLabel}</InfoRow>
        </div>
        {scanAnother}
      </div>
    );
  }

  if (state === "already-registered") {
    return (
      <div data-testid="delivery-already-registered" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "16px" }}>
        <StatusHero
          tone="neutral"
          icon={CheckCircle2}
          kicker="SIN CAMBIOS"
          title="La entrega ya había sido registrada"
          description="No es necesario confirmarla de nuevo."
        />
        {scanAnother}
      </div>
    );
  }

  return (
    <div data-testid="clearance-panel" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "8px" }}>
      <StatusHero
        tone="cleared"
        icon={ShieldCheck}
        kicker="AUTORIZADO PARA ENTREGA"
        title="Pago confirmado"
        description="Saldo liquidado. Verifique el producto y entréguelo al cliente."
      />

      <div className="pf-card" style={{ overflow: "hidden" }}>
        <InfoRow icon={User} label="Cliente">{order.customerLabel}</InfoRow>
        <InfoRow icon={Package} label="Producto">{order.productLabel}</InfoRow>
        <InfoRow icon={Wallet} label="Saldo pendiente" emphasis last>
          <span style={{ color: "var(--state-cleared-ink)" }}>$0.00</span>
        </InfoRow>
      </div>

      {state === "error" && (
        <p
          role="alert"
          data-testid="delivery-error"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: 1.45,
            padding: "12px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--state-blocked-border)",
            color: "var(--state-blocked-ink)",
            backgroundColor: "var(--state-blocked-bg)",
          }}
        >
          <AlertCircle size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }} />
          {networkFailed
            ? "Sin conexión al confirmar. Reintentar es seguro: la entrega no se registra dos veces."
            : "No se pudo confirmar la entrega. Reconsulte el estado."}
        </p>
      )}

      <Button
        fullWidth
        size="xl"
        loading={state === "loading"}
        error={state === "error"}
        onClick={handleConfirm}
        data-testid="delivery-confirm"
        icon={<PackageCheck size={22} aria-hidden="true" />}
      >
        {state === "loading" ? "Confirmando entrega…" : networkFailed ? "Reintentar (seguro)" : "Confirmar entrega física"}
      </Button>
    </div>
  );
}
