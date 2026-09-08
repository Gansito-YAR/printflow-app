// delivery-guard.test.ts — 3 pruebas negativas OBLIGATORIAS.
// Constitution Principle I: el botón NO debe existir en el DOM bajo DENY.
// FR-023, SC-003.

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { DeliveryResultScreen } from "../src/features/delivery/DeliveryResultScreen";
import { useSessionStore } from "../src/store/session";
import type { SessionDTO } from "../src/data/contracts";

// Mock session válida
const mockSession: SessionDTO = {
  userToken: "[PAYLOAD_OPACO_DE_SESION]",
  fullName: "[INSTALADOR DEMO]",
  role: "INSTALLER",
  sessionStartedAt: new Date().toISOString(),
  absoluteDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
};

function renderDeliveryResult(orderToken: string) {
  // Set session in store
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

describe("delivery-guard negative tests", () => {
  it("F2: con deuda (balanceDue '1250.50') → delivery-confirm NO existe en DOM", async () => {
    const { queryByTestId, container } = renderDeliveryResult("F2-CON-DEUDA");
    // Esperar a que se resuelva el mock (500-800ms)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(queryByTestId("delivery-confirm")).toBeNull();
    // Verificar que el panel de bloqueo sí está
    expect(queryByTestId("blocked-delivery-panel")).not.toBeNull();
  });

  it("F3: saldo desconocido (balanceDue null) → delivery-confirm NO existe en DOM", async () => {
    const { queryByTestId } = renderDeliveryResult("F3-SALDO-DESCONOCIDO");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(queryByTestId("delivery-confirm")).toBeNull();
    expect(queryByTestId("validation-unavailable-panel")).not.toBeNull();
  });

  it("F4: sobrepago (balanceDue '-100.00') → delivery-confirm NO existe en DOM", async () => {
    const { queryByTestId } = renderDeliveryResult("F4-SOBREPAGO");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(queryByTestId("delivery-confirm")).toBeNull();
    expect(queryByTestId("validation-unavailable-panel")).not.toBeNull();
  });
});
