// flujo-entrega.test.tsx — Fases 3 y 4 del plan de conexión (APP-05c / APP-05d).
// Corre con el gateway mock (sin red). UUIDs y nombres deliberadamente "no reales".

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ScannerScreen } from "../src/features/scanner/ScannerScreen";
import { NotDeliverablePanel } from "../src/features/delivery/NotDeliverablePanel";
import { ClearancePanel } from "../src/features/delivery/ClearancePanel";
import { DeliveryResultScreen } from "../src/features/delivery/DeliveryResultScreen";
import { SessionExpiredModal } from "../src/components/feedback/SessionExpiredModal";
import { useSessionStore, usableSession } from "../src/store/session";
import { gateway } from "../src/data/mocks/mockGateway";
import type { ScannedOrderDTO, SessionDTO } from "../src/data/contracts";

const session: SessionDTO = {
  userToken: "[PAYLOAD_OPACO_DE_SESION]",
  fullName: "[INSTALADOR DEMO]",
  role: "INSTALLER",
  sessionStartedAt: new Date().toISOString(),
  absoluteDeadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
};

const order = (over: Partial<ScannedOrderDTO> = {}): ScannedOrderDTO => ({
  orderToken: "[TOKEN_DEMO]",
  customerLabel: "[CLIENTE DEMO]",
  productLabel: "[LONA DEMO]",
  status: "READY_FOR_DELIVERY",
  balanceDue: "0.00",
  ...over,
});

afterEach(() => {
  useSessionStore.getState().clearLocal();
  vi.restoreAllMocks();
});

describe("M-01: una sola consulta por escaneo", () => {
  it("el escáner valida y navega SIN consultar al servidor", () => {
    const spy = vi.spyOn(gateway, "scanOrder");
    useSessionStore.getState().login(session);
    useSessionStore.getState().setOnline(true);
    render(
      <MemoryRouter initialEntries={["/escanear"]}>
        <Routes>
          <Route path="/escanear" element={<ScannerScreen />} />
          <Route path="/resultado/:orderToken" element={<p>pantalla de resultado</p>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByTestId("input-manual-token"), { target: { value: "F1-LIQUIDADO" } });
    fireEvent.click(screen.getByTestId("button-manual-scan"));
    expect(screen.getByText("pantalla de resultado")).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it("la pantalla de resultado consulta exactamente una vez", async () => {
    const spy = vi.spyOn(gateway, "scanOrder").mockResolvedValue({ kind: "FOUND", order: order() });
    useSessionStore.getState().login(session);
    useSessionStore.getState().setOnline(true);
    render(
      <MemoryRouter initialEntries={["/resultado/X"]}>
        <Routes>
          <Route path="/resultado/:orderToken" element={<DeliveryResultScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByTestId("delivery-confirm");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("APP-D-14: motivo cuando no se puede entregar", () => {
  it.each([
    ["CANCELLED", "PEDIDO CANCELADO"],
    ["PENDING_DEPOSIT", "Pedido sin anticipo"],
    ["IN_PRODUCTION", "Pedido todavía en taller"],
    ["DELIVERED", "Este pedido ya fue entregado"],
  ] as const)("%s → %s, sin botón de entrega", (status, title) => {
    render(
      <MemoryRouter>
        <NotDeliverablePanel status={status} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("not-deliverable-title")).toHaveTextContent(title);
    expect(screen.queryByTestId("delivery-confirm")).toBeNull();
  });

  it("CANCELLED en la pantalla de resultado: no entregable y sin botón (candado)", async () => {
    vi.spyOn(gateway, "scanOrder").mockResolvedValue({ kind: "FOUND", order: order({ status: "CANCELLED", balanceDue: "450.00" }) });
    useSessionStore.getState().login(session);
    useSessionStore.getState().setOnline(true);
    render(
      <MemoryRouter initialEntries={["/resultado/X"]}>
        <Routes>
          <Route path="/resultado/:orderToken" element={<DeliveryResultScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId("not-deliverable-title")).toHaveTextContent("PEDIDO CANCELADO");
    expect(screen.queryByTestId("delivery-confirm")).toBeNull();
  });
});

describe("APP-04e: confirmar entrega", () => {
  function renderClearance() {
    return render(
      <MemoryRouter>
        <ClearancePanel order={order()} />
      </MemoryRouter>,
    );
  }

  it("dos toques en el mismo instante = una sola confirmación", async () => {
    let resolve!: (v: { ok: true; deliveredAt: string }) => void;
    const spy = vi.spyOn(gateway, "confirmDelivery").mockReturnValue(new Promise((r) => (resolve = r)));
    renderClearance();
    const btn = screen.getByTestId("delivery-confirm");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(spy).toHaveBeenCalledTimes(1);
    resolve({ ok: true, deliveredAt: new Date().toISOString() });
    expect(await screen.findByTestId("delivery-success")).toBeInTheDocument();
  });

  it("red cae y el reintento devuelve ALREADY_DELIVERED → se muestra como éxito", async () => {
    const spy = vi
      .spyOn(gateway, "confirmDelivery")
      .mockRejectedValueOnce(new Error("NETWORK_ERROR"))
      .mockResolvedValueOnce({ ok: false, code: "ALREADY_DELIVERED", reason: "Ya." });
    renderClearance();
    fireEvent.click(screen.getByTestId("delivery-confirm"));
    expect(await screen.findByText("Reintentar (seguro)")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("delivery-confirm"));
    expect(await screen.findByTestId("delivery-success")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("ALREADY_DELIVERED sin fallo previo: 'ya había sido registrada'", async () => {
    vi.spyOn(gateway, "confirmDelivery").mockResolvedValue({ ok: false, code: "ALREADY_DELIVERED", reason: "Ya." });
    renderClearance();
    fireEvent.click(screen.getByTestId("delivery-confirm"));
    expect(await screen.findByTestId("delivery-already-registered")).toBeInTheDocument();
  });
});

describe("APP-03: sesión revocada por el servidor", () => {
  it("revoke() deja la sesión inutilizable para el candado y muestra el modal", async () => {
    useSessionStore.getState().login(session);
    useSessionStore.getState().revoke("REVOKED");
    expect(usableSession(useSessionStore.getState())).toBeNull();
    render(
      <MemoryRouter>
        <SessionExpiredModal />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("session-expired-reason")).toHaveTextContent("cerró su sesión");
  });

  it("con la sesión revocada, un pedido liquidado NO muestra el botón de entrega", async () => {
    vi.spyOn(gateway, "scanOrder").mockResolvedValue({ kind: "FOUND", order: order() });
    useSessionStore.getState().login(session);
    useSessionStore.getState().setOnline(true);
    useSessionStore.getState().revoke("REVOKED");
    render(
      <MemoryRouter initialEntries={["/resultado/X"]}>
        <Routes>
          <Route path="/resultado/:orderToken" element={<DeliveryResultScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.queryByTestId("delivery-loading")).toBeNull());
    expect(screen.queryByTestId("delivery-confirm")).toBeNull();
  });

  it("logout llama al cierre en el servidor registrado", async () => {
    const { setSignOutHook } = await import("../src/store/session");
    const hook = vi.fn(async () => {});
    setSignOutHook(hook);
    useSessionStore.getState().login(session);
    useSessionStore.getState().logout();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().session).toBeNull();
    setSignOutHook(null);
  });
});
