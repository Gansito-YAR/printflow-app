// ScannerScreen — FR-016, FR-017, FR-012.
// Fase 1.5: entrada manual de token, botón cerrar, linterna, permiso de cámara.
// Fase 6 (APP-06, constitución 1.1.0): con datos reales se usa la cámara del
// teléfono (CameraScanner). Con el mock se conserva el visor de marcador.
// Rediseño 1.2.0: visor a sangre con encuadre y línea de escaneo, linterna sobre
// la cámara, errores en tarjetas con icono, entrada manual en tarjeta (Enter envía).

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlaceholderBox } from "../../components/ui/PlaceholderBox";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  ArrowRight,
  CameraOff,
  Flashlight,
  FlashlightOff,
  Keyboard,
  QrCode,
  RotateCcw,
  WifiOff,
  X,
} from "lucide-react";

import { isMock, isValidPayload } from "../../data";
import { CameraScanner, type CameraProblem } from "./CameraScanner";
import { useSessionStore } from "../../store/session";
import { useScannerStore } from "../../store/scanner";
import { useScanPrefs, scanFeedback } from "../../store/scanPrefs";

export function ScannerScreen() {
  const navigate = useNavigate();
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const supportsTorch = useScannerStore((s) => s.supportsTorch);
  const cameraDenied = useScannerStore((s) => s.cameraPermissionDenied);
  const [error, setError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [validating, setValidating] = useState(false);
  // Ajustes de Perfil: linterna al abrir y captura manual primero (solo al montar).
  const prefs = useRef(useScanPrefs.getState()).current;
  const [torchOn, setTorchOn] = useState(isMock && prefs.torchOnOpen && supportsTorch);
  // Fase 6: estado de la cámara real (solo con datos reales).
  const [cameraProblem, setCameraProblem] = useState<CameraProblem | null>(null);
  const [cameraKey, setCameraKey] = useState(0); // remontar = volver a pedir la cámara
  const [realTorch, setRealTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(isMock || prefs.manualFirst);
  const lastRead = useRef<{ text: string; at: number } | null>(null);

  const torchAvailable = isMock ? supportsTorch : realTorch;
  const showCameraProblem = isMock ? cameraDenied : cameraProblem !== null;

  // M-01 (APP-04a): aquí solo se valida el formato del código y se navega.
  // La consulta al servidor se hace UNA vez, en la pantalla de resultado.
  const handleManualScan = () => {
    const token = manualToken.trim();
    if (!token || !isOnline || validating) return;
    setError(false);
    setNetworkError(false);
    if (!isValidPayload(token)) {
      setError(true);
      return;
    }
    setValidating(true);
    navigate(`/resultado/${encodeURIComponent(token)}`);
  };

  // APP-06e: lectura de la cámara. Lecturas repetidas del mismo código en 2 s se ignoran.
  const handleDecoded = (raw: string) => {
    const text = raw.trim();
    if (!text || validating || !isOnline) return;
    const now = Date.now();
    if (lastRead.current && lastRead.current.text === text && now - lastRead.current.at < 2000) return;
    lastRead.current = { text, at: now };
    if (!isValidPayload(text)) {
      setError(true);
      return;
    }
    setError(false);
    scanFeedback();
    setValidating(true);
    navigate(`/resultado/${encodeURIComponent(text)}`);
  };

  const retryCamera = () => {
    setCameraProblem(null);
    setCameraKey((k) => k + 1);
  };

  const PROBLEM_TEXT: Record<CameraProblem, { title: string; detail: string }> = {
    DENIED: {
      title: "Permiso de cámara denegado",
      detail:
        "Android: toque el candado junto a la dirección → Permisos → Cámara → Permitir. iPhone: Ajustes → Safari → Cámara → Permitir. Después pulse Reintentar.",
    },
    NO_CAMERA: { title: "No se encontró una cámara", detail: "Escriba el código impreso bajo el QR de la remisión." },
    INSECURE: {
      title: "La cámara requiere una conexión segura (HTTPS)",
      detail: "Abra la app desde su dirección https. Mientras tanto, escriba el código de la remisión.",
    },
    UNKNOWN: { title: "No se pudo abrir la cámara", detail: "Pulse Reintentar o escriba el código de la remisión." },
  };

  const iconButton: React.CSSProperties = {
    width: "48px",
    height: "48px",
    borderRadius: "var(--radius-full)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <div data-testid="scanner-screen" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Título + cerrar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "var(--ink-strong)" }}>Escanear entrega</h1>
          <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: "2px 0 0" }}>
            Apunte al código QR de la remisión
          </p>
        </div>
        <button
          data-testid="button-close-scanner"
          onClick={() => navigate("/mi-ruta")}
          disabled={validating}
          aria-label="Cerrar escáner"
          className="pf-pressable"
          style={{
            ...iconButton,
            border: "1px solid var(--border-hairline)",
            backgroundColor: "var(--surface-card)",
            color: "var(--ink-strong)",
            cursor: validating ? "not-allowed" : "pointer",
            opacity: validating ? 0.5 : 1,
          }}
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Visor de cámara, o el problema de cámara */}
      <div style={{ position: "relative" }}>
        {showCameraProblem ? (
          <div
            data-testid="camera-permission-denied"
            className="pf-card pf-enter"
            style={{
              padding: "28px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--state-warning-bg)",
                color: "var(--state-warning-ink)",
                border: "2px solid var(--state-warning-border)",
              }}
            >
              <CameraOff size={30} />
            </span>
            <p style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--ink-strong)" }} data-testid="camera-problem-title">
              {isMock || !cameraProblem ? "Permiso de cámara denegado" : PROBLEM_TEXT[cameraProblem].title}
            </p>
            <p style={{ fontSize: "14px", color: "var(--ink-base)", margin: 0, lineHeight: 1.5 }}>
              {isMock || !cameraProblem
                ? "Para escanear códigos QR necesita habilitar el acceso a la cámara en los ajustes de su dispositivo."
                : PROBLEM_TEXT[cameraProblem].detail}
            </p>
            <div style={{ width: "100%", marginTop: "4px" }}>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => (isMock ? navigate("/demo") : retryCamera())}
                data-testid="button-camera-permission"
                icon={<RotateCcw size={18} aria-hidden="true" />}
              >
                {isMock ? "Abrir ajustes de cámara" : "Reintentar"}
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              borderRadius: "var(--radius-2xl)",
              overflow: "hidden",
              backgroundColor: "var(--camera-bg)",
              // Proporción 4:3 sin alto mínimo (un mínimo fijo desbordaba a 360 px);
              // en horizontal se limita al 60 % del alto para dejar ver los controles.
              aspectRatio: "4 / 3",
              maxHeight: "60dvh",
              width: "100%",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {isMock ? (
              <PlaceholderBox
                label="CAMERA FEED — NO IMAGE REAL"
                minHeight="100%"
                trama
                data-testid="camera-viewport"
              />
            ) : (
              <CameraScanner
                key={cameraKey}
                onDecode={handleDecoded}
                onProblem={(p) => {
                  setCameraProblem(p);
                  setManualOpen(true); // sin cámara, la entrada manual queda a la vista
                }}
                onTorchSupport={(supported) => {
                  setRealTorch(supported);
                  if (supported && prefs.torchOnOpen) setTorchOn(true);
                }}
                torchOn={torchOn}
                paused={!isOnline || validating}
              />
            )}

            {/* Encuadre: esquinas de marca + línea de escaneo (se oculta con reduced-motion) */}
            <div
              data-testid="reticule"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(224px, 62%)",
                aspectRatio: "1 / 1",
                pointerEvents: "none",
                borderRadius: "24px",
                boxShadow: isMock ? "none" : "0 0 0 9999px var(--camera-scrim)",
              }}
            >
              {[
                { top: 0, left: 0, borderTop: "4px solid var(--brand-bg)", borderLeft: "4px solid var(--brand-bg)", borderTopLeftRadius: "24px" },
                { top: 0, right: 0, borderTop: "4px solid var(--brand-bg)", borderRight: "4px solid var(--brand-bg)", borderTopRightRadius: "24px" },
                { bottom: 0, left: 0, borderBottom: "4px solid var(--brand-bg)", borderLeft: "4px solid var(--brand-bg)", borderBottomLeftRadius: "24px" },
                { bottom: 0, right: 0, borderBottom: "4px solid var(--brand-bg)", borderRight: "4px solid var(--brand-bg)", borderBottomRightRadius: "24px" },
              ].map((style, i) => (
                <div key={i} style={{ position: "absolute", width: "40px", height: "40px", ...style }} />
              ))}
              {isOnline && !validating && (
                <div
                  className="pf-scanline"
                  style={{
                    position: "absolute",
                    left: "16px",
                    right: "16px",
                    top: "14px",
                    height: "2px",
                    borderRadius: "2px",
                    backgroundColor: "var(--brand-bg)",
                    boxShadow: "0 0 12px var(--brand-bg)",
                  }}
                />
              )}
            </div>

            {/* Linterna: en demo según el panel; con cámara real solo si la cámara la soporta. */}
            {torchAvailable && (
              <button
                data-testid="button-torch"
                onClick={() => setTorchOn(!torchOn)}
                aria-pressed={torchOn}
                aria-label={torchOn ? "Apagar linterna" : "Encender linterna"}
                className="pf-pressable"
                style={{
                  ...iconButton,
                  position: "absolute",
                  right: "12px",
                  bottom: "12px",
                  width: "auto",
                  padding: "0 14px",
                  gap: "6px",
                  border: "none",
                  backgroundColor: torchOn ? "var(--brand-bg)" : "var(--camera-control-bg)",
                  color: torchOn ? "var(--brand-ink)" : "var(--camera-ink)",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {torchOn ? <Flashlight size={18} aria-hidden="true" /> : <FlashlightOff size={18} aria-hidden="true" />}
                Linterna {torchOn ? "encendida" : "apagada"}
              </button>
            )}

            {!isOnline && (
              <div
                data-testid="scanner-offline-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "var(--state-warning-bg)",
                  opacity: 0.96,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "24px",
                  textAlign: "center",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--state-warning-ink)",
                }}
              >
                <WifiOff size={32} aria-hidden="true" />
                Sin conexión. Muévase a un área con cobertura para validar la entrega
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR no reconocido */}
      {error && (
        <div
          data-testid="qr-not-recognized"
          role="alert"
          className="pf-enter"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 12px 12px 16px",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--state-blocked-border)",
            backgroundColor: "var(--state-blocked-bg)",
            color: "var(--state-blocked-ink)",
          }}
        >
          <QrCode size={22} aria-hidden="true" style={{ flexShrink: 0 }} />
          <p style={{ flex: 1, fontWeight: 700, margin: 0, fontSize: "15px" }}>Código QR no reconocido</p>
          <button
            onClick={() => setError(false)}
            data-testid="button-scan-again"
            className="pf-pressable"
            style={{
              minHeight: "44px",
              padding: "0 14px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--state-blocked-border)",
              backgroundColor: "transparent",
              color: "inherit",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Escanear de nuevo
          </button>
        </div>
      )}

      {/* Error de red — distinto de QR no reconocido (A.5) */}
      {networkError && (
        <div
          data-testid="scan-network-error"
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 12px 12px 16px",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--state-warning-border)",
            backgroundColor: "var(--state-warning-bg)",
            color: "var(--state-warning-ink)",
          }}
        >
          <WifiOff size={22} aria-hidden="true" style={{ flexShrink: 0 }} />
          <p style={{ flex: 1, fontWeight: 700, margin: 0, fontSize: "15px" }}>Sin conexión al validar. Intente de nuevo.</p>
          <button
            onClick={() => setNetworkError(false)}
            data-testid="button-retry-scan"
            className="pf-pressable"
            style={{
              minHeight: "44px",
              padding: "0 14px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--state-warning-border)",
              backgroundColor: "transparent",
              color: "inherit",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* APP-06f: con cámara real, la entrada manual es el respaldo (plegada). */}
      {!manualOpen && (
        <button
          type="button"
          data-testid="button-open-manual"
          onClick={() => setManualOpen(true)}
          className="pf-pressable"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minHeight: "52px",
            borderRadius: "var(--radius-xl)",
            background: "transparent",
            border: "1px dashed var(--border-hairline)",
            color: "var(--ink-base)",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Keyboard size={18} aria-hidden="true" />
          ¿No lee el código? Escribirlo
        </button>
      )}

      {/* Entrada manual del código */}
      {manualOpen && (
        <form
          data-testid="manual-token-section"
          className="pf-card"
          onSubmit={(e) => {
            e.preventDefault();
            handleManualScan();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}
        >
          <Input
            label="Código de la remisión"
            type="text"
            value={manualToken}
            onChange={setManualToken}
            placeholder="Escriba el código aquí"
            disabled={validating}
            autoCapitalize="none"
            icon={<Keyboard size={20} />}
            hint={
              isMock
                ? "Modo demo: escriba F1-LIQUIDADO, F2-CON-DEUDA, F3-SALDO-DESCONOCIDO, F4-SOBREPAGO, F5-EN-PRODUCCION, F6-YA-ENTREGADO o F7-QR-DESCONOCIDO"
                : "Si la cámara no lee el código, escriba el código impreso bajo el QR de la remisión."
            }
            data-testid="input-manual-token"
          />
          <Button
            fullWidth
            type="submit"
            disabled={!manualToken.trim() || !isOnline}
            loading={validating}
            data-testid="button-manual-scan"
            icon={<ArrowRight size={20} aria-hidden="true" />}
          >
            {validating ? "Validando código…" : "Validar código"}
          </Button>
        </form>
      )}
    </div>
  );
}
