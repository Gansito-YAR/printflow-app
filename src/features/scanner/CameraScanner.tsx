// CameraScanner — lectura real del QR con la cámara trasera (Fase 6, APP-06).
// Solo se monta con datos reales (VITE_DATA_SOURCE=supabase); con el mock se
// conserva el visor de marcador de posición de la Fase 1.
//
// - `qr-scanner` se importa en diferido: no pesa en la carga inicial de la app.
// - Usa BarcodeDetector nativo cuando existe y un worker como respaldo (iOS).
// - La cámara se detiene al salir de la pantalla o al desmontar.
// - Requiere contexto seguro (HTTPS o localhost): getUserMedia lo exige.

import { useEffect, useRef } from "react";
import type QrScannerType from "qr-scanner";

export type CameraProblem = "DENIED" | "NO_CAMERA" | "INSECURE" | "UNKNOWN";

interface Props {
  /** Texto decodificado del QR (sin validar). */
  onDecode: (text: string) => void;
  onProblem: (problem: CameraProblem) => void;
  onTorchSupport: (supported: boolean) => void;
  torchOn: boolean;
  /** Pausa la lectura (p. ej. mientras se navega o sin conexión). */
  paused: boolean;
}

export function CameraScanner({ onDecode, onProblem, onTorchSupport, torchOn, paused }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  // Las funciones cambian en cada render; el escáner usa siempre la última.
  const handlers = useRef({ onDecode, onProblem, onTorchSupport });
  handlers.current = { onDecode, onProblem, onTorchSupport };

  useEffect(() => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      handlers.current.onProblem("INSECURE");
      return;
    }
    let disposed = false;
    let scanner: QrScannerType | null = null;

    (async () => {
      try {
        const { default: QrScanner } = await import("qr-scanner");
        if (disposed || !videoRef.current) return;
        if (!(await QrScanner.hasCamera())) {
          handlers.current.onProblem("NO_CAMERA");
          return;
        }
        scanner = new QrScanner(videoRef.current, (result) => handlers.current.onDecode(result.data), {
          preferredCamera: "environment",
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
        });
        scannerRef.current = scanner;
        await scanner.start();
        if (disposed) {
          scanner.destroy();
          return;
        }
        handlers.current.onTorchSupport(await scanner.hasFlash().catch(() => false));
      } catch (err) {
        if (disposed) return;
        const text = String((err as { name?: string })?.name ?? err);
        if (/NotAllowed|Permission|denied/i.test(text)) handlers.current.onProblem("DENIED");
        else if (/NotFound|Camera not found|no camera/i.test(text)) handlers.current.onProblem("NO_CAMERA");
        else handlers.current.onProblem("UNKNOWN");
      }
    })();

    return () => {
      disposed = true;
      scannerRef.current = null;
      scanner?.stop();
      scanner?.destroy();
    };
  }, []);

  // Linterna real: solo si la cámara la soporta (onTorchSupport).
  useEffect(() => {
    const s = scannerRef.current;
    if (!s) return;
    (torchOn ? s.turnFlashOn() : s.turnFlashOff()).catch(() => undefined);
  }, [torchOn]);

  // Pausar/reanudar sin soltar el permiso de cámara.
  useEffect(() => {
    const s = scannerRef.current;
    if (!s) return;
    if (paused) void s.pause();
    else void s.start().catch(() => undefined);
  }, [paused]);

  return (
    <video
      ref={videoRef}
      data-testid="camera-video"
      muted
      playsInline
      aria-label="Vista de la cámara para leer el código QR de la remisión"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        objectFit: "cover",
        display: "block",
        backgroundColor: "var(--camera-bg)",
      }}
    />
  );
}
