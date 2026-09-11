// delivery-guard.test.tsx — pruebas del candado de entrega.
// Constitution Principle I: el botón NO debe existir en el DOM bajo DENY.
// FR-023, SC-003.
// A.8: pruebas positivas (F1 renderiza botón, F5 no, lectura vencida no).
// A.9: fake timers + mock instantáneo para eliminar warnings de act().

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { DeliveryResultScreen } from "../src/features/delivery/DeliveryResultScreen";
import { useSessionStore } from "../src/store/session";
import { gateway } from "../src/data/mocks/mockGateway";
import { FIXTURES } from "../src/data/mocks/fixtures";
import type { SessionDTO, ScanOutcome } from "../src/data/contracts";

// Mock session válida
const mockSession: SessionDTO = {
  userToken: "[PAYLOAD_OPACO_DE_SESION]",
  fullName: "[INSTALADOR DEMO]",
  role: "INSTALLER",
  sessionStartedAt: new Date().toISOString(),
  absoluteDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
};

function setupMockScanOrder(outcome: ScanOutcome) {
  vi.spyOn(gateway, "scanOrder").mockResolvedValue(outcome);
}

function renderDeliveryResult(orderToken: string) {
  useSessionStore.getState().login(mockSession);
  useSessionStore.getState().setOnline(true);
  return render(
    <MemoryRouter initialEntries={[`/resultado/${orderToken}`]}>
      <Routes>
        <Route path="/resultado/:orderToken" element={<DeliveryResultScreen />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => {
    vi.useRealTimers();
  });
  useSessionStore.getState().logout();
  vi.restoreAllMocks();
});

describe("delivery-guard negative tests", () => {
  it("F2: con deuda (balanceDue '1250.50') → delivery-confirm NO existe en DOM", async () => {
    setupMockScanOrder({ kind: "FOUND", order: FIXTURES["F2-CON-DEUDA"]! });
    const { queryByTestId, unmount } = renderDeliveryResult("F2-CON-DEUDA");
    // Avanzar para que se resuelva el mock async
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(queryByTestId("blocked-delivery-panel")).not.toBeNull();
    expect(queryByTestId("delivery-confirm")).toBeNull();
    act(() => unmount());
  });

  it("F3: saldo desconocido (balanceDue null) → delivery-confirm NO existe en DOM", async () => {
    setupMockScanOrder({ kind: "FOUND", order: FIXTURES["F3-SALDO-DESCONOCIDO"]! });
    const { queryByTestId, unmount } = renderDeliveryResult("F3-SALDO-DESCONOCIDO");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(queryByTestId("validation-unavailable-panel")).not.toBeNull();
    expect(queryByTestId("delivery-confirm")).toBeNull();
    act(() => unmount());
  });

  it("F4: sobrepago (balanceDue '-100.00') → delivery-confirm NO existe en DOM", async () => {
    setupMockScanOrder({ kind: "FOUND", order: FIXTURES["F4-SOBREPAGO"]! });
    const { queryByTestId, unmount } = renderDeliveryResult("F4-SOBREPAGO");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(queryByTestId("validation-unavailable-panel")).not.toBeNull();
    expect(queryByTestId("delivery-confirm")).toBeNull();
    act(() => unmount());
  });
});

describe("delivery-guard positive tests", () => {
  it("F1: liquidado (balanceDue '0.00') → delivery-confirm SÍ existe en DOM", async () => {
    setupMockScanOrder({ kind: "FOUND", order: FIXTURES["F1-LIQUIDADO"]! });
    const { queryByTestId, unmount } = renderDeliveryResult("F1-LIQUIDADO");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(queryByTestId("clearance-panel")).not.toBeNull();
    expect(queryByTestId("delivery-confirm")).not.toBeNull();
    act(() => unmount());
  });

  it("F5: en producción → se monta NotDeliverablePanel y no hay botón", async () => {
    setupMockScanOrder({ kind: "FOUND", order: FIXTURES["F5-EN-PRODUCCION"]! });
    const { queryByTestId, unmount } = renderDeliveryResult("F5-EN-PRODUCCION");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(queryByTestId("not-deliverable-panel")).not.toBeNull();
    expect(queryByTestId("delivery-confirm")).toBeNull();
    act(() => unmount());
  });

  it("lectura vencida (readAt hace 90s) → DENY, el botón no existe", async () => {
    setupMockScanOrder({ kind: "FOUND", order: FIXTURES["F1-LIQUIDADO"]! });
    const { queryByTestId, unmount } = renderDeliveryResult("F1-LIQUIDADO");

    // Resolver el mock async
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    // El botón SÍ existe al principio (F1 liquidado, lectura viva)
    expect(queryByTestId("delivery-confirm")).not.toBeNull();

    // Avanzar 90 segundos — pasado la ventana de lectura viva de 60s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(90 * 1000);
    });

    // El botón debe desaparecer — la lectura venció
    expect(queryByTestId("delivery-confirm")).toBeNull();
    expect(queryByTestId("validation-unavailable-panel")).not.toBeNull();
    act(() => unmount());
  });
});
