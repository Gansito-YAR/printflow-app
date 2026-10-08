// camara.test.tsx — Fase 6 (APP-06): escáner con cámara real (qr-scanner simulado).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const UUID = "11111111-2222-4333-8444-555555555555";

// --- qr-scanner simulado -------------------------------------------------------
const fake = vi.hoisted(() => ({
  onDecode: null as null | ((r: { data: string }) => void),
  startImpl: (async () => undefined) as () => Promise<void>,
  hasCamera: true,
  hasFlash: true,
  starts: 0,
}));
vi.mock("qr-scanner", () => ({
  default: class FakeQrScanner {
    static hasCamera = async () => fake.hasCamera;
    constructor(_video: HTMLVideoElement, onDecode: (r: { data: string }) => void) {
      fake.onDecode = onDecode;
    }
    start = async () => {
      fake.starts++;
      return fake.startImpl();
    };
    stop() {}
    destroy() {}
    pause = async () => true;
    hasFlash = async () => fake.hasFlash;
    turnFlashOn = async () => undefined;
    turnFlashOff = async () => undefined;
  },
}));

// --- Capa de datos en modo "supabase" (sin red: no se llama al gateway aquí) ---
vi.mock("../src/data", () => ({
  isMock: false,
  isValidPayload: (p: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.trim()),
}));

import { ScannerScreen } from "../src/features/scanner/ScannerScreen";
import { useSessionStore } from "../src/store/session";

function renderScanner() {
  useSessionStore.getState().setOnline(true);
  return render(
    <MemoryRouter initialEntries={["/escanear"]}>
      <Routes>
        <Route path="/escanear" element={<ScannerScreen />} />
        <Route path="/resultado/:orderToken" element={<p data-testid="result">resultado</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  fake.onDecode = null;
  fake.startImpl = async () => undefined;
  fake.hasCamera = true;
  fake.hasFlash = true;
  fake.starts = 0;
  Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
});
afterEach(() => vi.restoreAllMocks());

describe("cámara real", () => {
  it("abre la cámara y, al leer un QR válido, vibra y navega al resultado", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    renderScanner();
    expect(screen.getByTestId("camera-video")).toBeInTheDocument();
    await waitFor(() => expect(fake.onDecode).not.toBeNull());
    act(() => fake.onDecode!({ data: UUID }));
    expect(await screen.findByTestId("result")).toBeInTheDocument();
    expect(vibrate).toHaveBeenCalledWith(80);
  });

  it("un código que no es del sistema muestra 'no reconocido' y no navega", async () => {
    renderScanner();
    await waitFor(() => expect(fake.onDecode).not.toBeNull());
    act(() => fake.onDecode!({ data: "https://sitio-cualquiera.com" }));
    expect(await screen.findByTestId("qr-not-recognized")).toBeInTheDocument();
    expect(screen.queryByTestId("result")).toBeNull();
  });

  it("la linterna solo aparece si la cámara la soporta", async () => {
    fake.hasFlash = false;
    renderScanner();
    await waitFor(() => expect(fake.starts).toBe(1));
    await act(async () => undefined);
    expect(screen.queryByTestId("button-torch")).toBeNull();
  });

  it("con linterna disponible, aparece el botón", async () => {
    renderScanner();
    expect(await screen.findByTestId("button-torch")).toBeInTheDocument();
  });

  it("la entrada manual es el respaldo plegado", async () => {
    renderScanner();
    expect(screen.queryByTestId("manual-token-section")).toBeNull();
    fireEvent.click(screen.getByTestId("button-open-manual"));
    expect(screen.getByTestId("manual-token-section")).toBeInTheDocument();
  });
});

describe("problemas de cámara", () => {
  it("permiso denegado: instrucciones, reintento y entrada manual abierta", async () => {
    fake.startImpl = async () => {
      throw Object.assign(new Error("denied"), { name: "NotAllowedError" });
    };
    renderScanner();
    expect(await screen.findByTestId("camera-problem-title")).toHaveTextContent("Permiso de cámara denegado");
    expect(screen.getByTestId("manual-token-section")).toBeInTheDocument();
    fake.startImpl = async () => undefined;
    fireEvent.click(screen.getByTestId("button-camera-permission")); // Reintentar
    await waitFor(() => expect(fake.starts).toBe(2));
    expect(await screen.findByTestId("camera-video")).toBeInTheDocument();
  });

  it("sin cámara en el dispositivo", async () => {
    fake.hasCamera = false;
    renderScanner();
    expect(await screen.findByTestId("camera-problem-title")).toHaveTextContent("No se encontró una cámara");
  });

  it("sin HTTPS: explica que la cámara requiere conexión segura", async () => {
    Object.defineProperty(window, "isSecureContext", { value: false, configurable: true });
    renderScanner();
    expect(await screen.findByTestId("camera-problem-title")).toHaveTextContent("HTTPS");
    expect(fake.starts).toBe(0);
  });
});
