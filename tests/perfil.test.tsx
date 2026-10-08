// perfil.test.tsx — pestaña Perfil: resumen, tiempo de sesión, ajustes y cierre de sesión.
// Corre con el gateway mock (sin red). Nombres deliberadamente "no reales".

import { describe, it, expect, afterEach, vi } from "vitest";

// El store de tema consulta matchMedia al importarse; jsdom no lo trae.
vi.hoisted(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
});
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProfileScreen } from "../src/features/profile/ProfileScreen";
import { useSessionStore } from "../src/store/session";
import { useScanPrefs } from "../src/store/scanPrefs";
import type { SessionDTO } from "../src/data/contracts";

const makeSession = (minutesLeft: number): SessionDTO => ({
  userToken: "[PAYLOAD_OPACO_DE_SESION]",
  fullName: "[INSTALADOR DEMO]",
  role: "INSTALLER",
  sessionStartedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  absoluteDeadline: new Date(Date.now() + minutesLeft * 60 * 1000).toISOString(),
});

function renderProfile(minutesLeft = 600) {
  useSessionStore.getState().login(makeSession(minutesLeft));
  useSessionStore.getState().setOnline(true);
  return render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <Routes>
        <Route path="/perfil" element={<ProfileScreen />} />
        <Route path="/login" element={<p>pantalla de login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  useSessionStore.getState().clearLocal();
  localStorage.clear();
});

describe("Perfil", () => {
  it("muestra el resumen del turno con conteos", async () => {
    renderProfile();
    expect(await screen.findByTestId("shift-summary")).toBeTruthy();
    expect(screen.getByTestId("summary-delivered").textContent).toMatch(/^\d+$/);
  });

  it("tiempo restante y aviso cuando faltan menos de 30 minutos", () => {
    renderProfile(20);
    expect(screen.getByTestId("session-remaining").textContent).toMatch(/Quedan (19|20) min/);
    expect(screen.getByTestId("session-warning")).toBeTruthy();
  });

  it("sin aviso con tiempo suficiente", () => {
    renderProfile(600);
    expect(screen.queryByTestId("session-warning")).toBeNull();
  });

  it("los ajustes de escaneo se guardan en el teléfono", () => {
    renderProfile();
    const sw = screen.getByTestId("pref-sound");
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(useScanPrefs.getState().sound).toBe(true);
    expect(JSON.parse(localStorage.getItem("printflow-scan-prefs") ?? "{}").sound).toBe(true);
    useScanPrefs.getState().set("sound", false);
  });

  it("cerrar sesión pide confirmación", async () => {
    renderProfile();
    fireEvent.click(screen.getByTestId("button-logout"));
    expect(useSessionStore.getState().session).not.toBeNull();
    fireEvent.click(screen.getByTestId("button-logout-confirm"));
    await waitFor(() => expect(screen.getByText("pantalla de login")).toBeTruthy());
    expect(useSessionStore.getState().session).toBeNull();
  });
});
