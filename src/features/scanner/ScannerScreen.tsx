// ScannerScreen — FR-016, FR-017, FR-012.
// Constitution Principle V: sin cámara real, viewport placeholder.
// Fase 1.5: entrada manual de token, botón cerrar, linterna, permiso de cámara.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlaceholderBox } from "../../components/ui/PlaceholderBox";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { gateway } from "../../data/mocks/mockGateway";
import { useSessionStore } from "../../store/session";
import { useDemoStore } from "../../store/demo";

export function ScannerScreen() {
  const navigate = useNavigate();
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const supportsTorch = useDemoStore((s) => s.supportsTorch);
  const cameraDenied = useDemoStore((s) => s.cameraPermissionDenied);
  const [error, setError] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const handleManualScan = async () => {
    if (!manualToken.trim() || !isOnline || validating) return;
    setValidating(true);
    setError(false);
    try {
      const outcome = await gateway.scanOrder(manualToken.trim());
      if (outcome.kind === "FOUND") {
        navigate(`/resultado/${manualToken.trim()}`);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setValidating(false);
    }
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
        {cameraDenied ? (
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
            <p style={{ fontSize: "14px", fontWeight: 600 }}>Permiso de cámara denegado</p>
            <p style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
              Para escanear códigos QR necesita habilitar el acceso a la cámara en los ajustes de su dispositivo.
            </p>
            <button
              data-testid="button-camera-permission"
              onClick={() => navigate("/demo")}
              style={{
                height: "48px",
                minHeight: "var(--hitbox-min)",
                padding: "0 16px",
                backgroundColor: "var(--ink-strong)",
                color: "var(--surface-0)",
                border: "2px solid var(--ink-strong)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Abrir ajustes de cámara
            </button>
          </div>
        ) : (
          <>
            <PlaceholderBox
              label="CAMERA FEED — NO IMAGE REAL"
              aspectRatio="4/3"
              minHeight="288px"
              trama
              data-testid="camera-viewport"
            />
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
                { top: 0, left: 0, borderTop: "4px solid var(--border-strong)", borderLeft: "4px solid var(--border-strong)" },
                { top: 0, right: 0, borderTop: "4px solid var(--border-strong)", borderRight: "4px solid var(--border-strong)" },
                { bottom: 0, left: 0, borderBottom: "4px solid var(--border-strong)", borderLeft: "4px solid var(--border-strong)" },
                { bottom: 0, right: 0, borderBottom: "4px solid var(--border-strong)", borderRight: "4px solid var(--border-strong)" },
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
                  backgroundColor: "var(--surface-3)",
                  opacity: 0.9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                  textAlign: "center",
                  fontSize: "14px",
                  color: "var(--ink-strong)",
                }}
              >
                Sin conexión. Muévase a un área con cobertura para validar la entrega
              </div>
            )}
          </>
        )}
      </div>

      {/* Botón de linterna — visible en modo demo */}
      {supportsTorch && !cameraDenied && (
        <button
          data-testid="button-torch"
          onClick={() => setTorchOn(!torchOn)}
          style={{
            height: "48px",
            minWidth: "48px",
            padding: "0 16px",
            backgroundColor: torchOn ? "var(--ink-strong)" : "transparent",
            color: torchOn ? "var(--surface-0)" : "var(--ink-strong)",
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

      {/* Entrada manual de token — Fase 1.5 */}
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
          Modo demo: escriba F1-LIQUIDADO, F2-CON-DEUDA, F3-SALDO-DESCONOCIDO, F4-SOBREPAGO, F5-EN-PRODUCCION, F6-YA-ENTREGADO o F7-QR-DESCONOCIDO
        </p>
        <Button
          fullWidth
          disabled={!manualToken.trim() || !isOnline}
          loading={validating}
          onClick={handleManualScan}
          data-testid="button-manual-scan"
        >
          {validating ? (
            <>
              <Spinner size="sm" /> Validando código…
            </>
          ) : (
            "Validar código"
          )}
        </Button>
      </div>

      {/* QR no reconocido */}
      {error && (
        <div
          data-testid="qr-not-recognized"
          style={{
            padding: "16px",
            border: "2px solid var(--border-strong)",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>Código QR no reconocido</p>
          <Button variant="secondary" onClick={() => setError(false)} data-testid="button-scan-again">
            Escanear de nuevo
          </Button>
        </div>
      )}
    </div>
  );
}
