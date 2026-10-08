// ScannerScreen — FR-016, FR-017, FR-012.
// Fase 1.5: entrada manual de token, botón cerrar, linterna, permiso de cámara.
// Fase 6 (APP-06, constitución 1.1.0): con datos reales se usa la cámara del
// teléfono (CameraScanner). Con el mock se conserva el visor de marcador.

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlaceholderBox } from "../../components/ui/PlaceholderBox";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

import { isMock, isValidPayload } from "../../data";
import { CameraScanner, type CameraProblem } from "./CameraScanner";
import { useSessionStore } from "../../store/session";
import { useScannerStore } from "../../store/scanner";

export function ScannerScreen() {
  const navigate = useNavigate();
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const supportsTorch = useScannerStore((s) => s.supportsTorch);
  const cameraDenied = useScannerStore((s) => s.cameraPermissionDenied);
  const [error, setError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  // Fase 6: estado de la cámara real (solo con datos reales).
  const [cameraProblem, setCameraProblem] = useState<CameraProblem | null>(null);
  const [cameraKey, setCameraKey] = useState(0); // remontar = volver a pedir la cámara
  const [realTorch, setRealTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(isMock);
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
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(80);
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

  return (
    <div data-testid="scanner-screen" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header con título + botón cerrar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700 }}>Escanear entrega</h1>
        <button
          data-testid="button-close-scanner"
          onClick={() => navigate("/mi-ruta")}
          disabled={validating}
          style={{
            height: "48px",
            minWidth: "48px",
            padding: "0 12px",
            backgroundColor: "transparent",
            border: "1px solid var(--border-hairline)",
            fontSize: "14px",
            cursor: validating ? "not-allowed" : "pointer",
            color: "var(--ink-strong)",
            opacity: validating ? 0.5 : 1,
          }}
        >
          Cerrar
        </button>
      </div>

      {/* Viewport de cámara o placeholder de permiso denegado */}
      <div style={{ position: "relative" }}>
        {showCameraProblem ? (
          <div
            data-testid="camera-permission-denied"
            style={{
              padding: "32px 16px",
              border: "2px solid var(--border-strong)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: "14px", fontWeight: 600 }} data-testid="camera-problem-title">
              {isMock || !cameraProblem ? "Permiso de cámara denegado" : PROBLEM_TEXT[cameraProblem].title}
            </p>
            <p style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
              {isMock || !cameraProblem
                ? "Para escanear códigos QR necesita habilitar el acceso a la cámara en los ajustes de su dispositivo."
                : PROBLEM_TEXT[cameraProblem].detail}
            </p>
            <button
              data-testid="button-camera-permission"
              onClick={() => (isMock ? navigate("/demo") : retryCamera())}
              style={{
                height: "48px",
                minHeight: "var(--hitbox-min)",
                padding: "0 16px",
                backgroundColor: "var(--action-primary-bg)",
                color: "var(--action-primary-ink)",
                border: "2px solid var(--ink-strong)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {isMock ? "Abrir ajustes de cámara" : "Reintentar"}
            </button>
          </div>
        ) : (
          <>
            {isMock ? (
              <PlaceholderBox
                label="CAMERA FEED — NO IMAGE REAL"
                aspectRatio="4/3"
                minHeight="288px"
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
                onTorchSupport={setRealTorch}
                torchOn={torchOn}
                paused={!isOnline || validating}
              />
            )}
            {/* Retícula 224x224 con 4 esquinas en L */}
            <div
              data-testid="reticule"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "224px",
                height: "224px",
                pointerEvents: "none",
              }}
            >
              {[
                { top: 0, left: 0, borderTop: "4px solid var(--brand-bg)", borderLeft: "4px solid var(--brand-bg)" },
                { top: 0, right: 0, borderTop: "4px solid var(--brand-bg)", borderRight: "4px solid var(--brand-bg)" },
                { bottom: 0, left: 0, borderBottom: "4px solid var(--brand-bg)", borderLeft: "4px solid var(--brand-bg)" },
                { bottom: 0, right: 0, borderBottom: "4px solid var(--brand-bg)", borderRight: "4px solid var(--brand-bg)" },
              ].map((style, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: "24px",
                    height: "24px",
                    ...style,
                  }}
                />
              ))}
            </div>
            {!isOnline && (
              <div
                data-testid="scanner-offline-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "var(--state-warning-bg)",
                  opacity: 0.95,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--state-warning-ink)",
                }}
              >
                Sin conexión. Muévase a un área con cobertura para validar la entrega
              </div>
            )}
          </>
        )}
      </div>

      {/* Linterna: en demo según el panel; con cámara real solo si la cámara la soporta. */}
      {torchAvailable && !showCameraProblem && (
        <button
          data-testid="button-torch"
          onClick={() => setTorchOn(!torchOn)}
          style={{
            height: "48px",
            minWidth: "48px",
            padding: "0 16px",
            backgroundColor: torchOn ? "var(--brand-bg)" : "transparent",
            color: torchOn ? "var(--brand-ink)" : "var(--ink-strong)",
            border: "2px solid var(--border-strong)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          [TORCH] Linterna {torchOn ? "encendida" : "apagada"}
        </button>
      )}

      <p style={{ fontSize: "14px", color: "var(--ink-muted)", textAlign: "center" }}>
        Escanee el código de la remisión
      </p>

      {/* APP-06f: con cámara real, la entrada manual es el respaldo (plegada). */}
      {!manualOpen && (
        <button
          type="button"
          data-testid="button-open-manual"
          onClick={() => setManualOpen(true)}
          style={{
            minHeight: "var(--hitbox-min)",
            background: "transparent",
            border: "1px solid var(--border-hairline)",
            color: "var(--ink-strong)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ¿No lee el código? Escribirlo
        </button>
      )}

      {/* Entrada manual de token — Fase 1.5 */}
      {manualOpen && (
      <div data-testid="manual-token-section" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Input
          label="Código de la remisión"
          type="text"
          value={manualToken}
          onChange={setManualToken}
          placeholder="Escriba el código aquí"
          disabled={validating}
          data-testid="input-manual-token"
        />
        <p style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
          {isMock
            ? "Modo demo: escriba F1-LIQUIDADO, F2-CON-DEUDA, F3-SALDO-DESCONOCIDO, F4-SOBREPAGO, F5-EN-PRODUCCION, F6-YA-ENTREGADO o F7-QR-DESCONOCIDO"
            : "Si la cámara no lee el código, escriba el código impreso bajo el QR de la remisión."}
        </p>
        <Button
          fullWidth
          disabled={!manualToken.trim() || !isOnline}
          loading={validating}
          onClick={handleManualScan}
          data-testid="button-manual-scan"
        >
          {validating ? "Validando código…" : "Validar código"}
        </Button>
      </div>
      )}

      {/* QR no reconocido */}
      {error && (
        <div
          data-testid="qr-not-recognized"
          style={{
            padding: "16px",
            border: "2px solid var(--state-blocked-border)",
            backgroundColor: "var(--state-blocked-bg)",
            color: "var(--state-blocked-ink)",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>Código QR no reconocido</p>
          <Button variant="secondary" onClick={() => setError(false)} data-testid="button-scan-again">
            Escanear de nuevo
          </Button>
        </div>
      )}

      {/* Error de red — distinto de QR no reconocido (A.5) */}
      {networkError && (
        <div
          data-testid="scan-network-error"
          style={{
            padding: "16px",
            border: "2px solid var(--state-warning-border)",
            backgroundColor: "var(--state-warning-bg)",
            color: "var(--state-warning-ink)",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>Sin conexión al validar. Intente de nuevo.</p>
          <Button variant="secondary" onClick={() => setNetworkError(false)} data-testid="button-retry-scan">
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
