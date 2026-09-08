// PrintFlow AI — mockGateway.ts
// Implementación mock de PrintflowGateway con latencia simulada.
// Constitution Principle V: sin fetch, sin Supabase.
// Fase 1.5: soporta modos de demo (confirmMode, routeMode, sessionExpired).

import type {
  SessionDTO,
  ScanOutcome,
  ConfirmDeliveryResult,
  RouteItemDTO,
} from "../contracts";
import type { PrintflowGateway } from "../gateway";
import { FIXTURES, MOCK_CREDENTIALS, MOCK_ROUTE_ITEMS, createMockSession } from "./fixtures";

type ConfirmMode = "OK" | "ERROR" | "ALREADY_REGISTERED";
type RouteMode = "NORMAL" | "EMPTY" | "ERROR";

/** Latencia simulada: 500-800ms (clarificación Q2) */
function mockDelay(): Promise<void> {
  const ms = Math.random() * 300 + 500;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockGateway implements PrintflowGateway {
  private isOnline: boolean = true;
  private confirmMode: ConfirmMode = "OK";
  private routeMode: RouteMode = "NORMAL";
  private sessionExpired: boolean = false;

  // Setters usados exclusivamente por la pantalla /demo
  setOnline(online: boolean): void {
    this.isOnline = online;
  }
  setConfirmMode(mode: ConfirmMode): void {
    this.confirmMode = mode;
  }
  setRouteMode(mode: RouteMode): void {
    this.routeMode = mode;
  }
  setSessionExpired(expired: boolean): void {
    this.sessionExpired = expired;
  }

  async signIn(email: string, password: string): Promise<SessionDTO> {
    await mockDelay();
    if (!this.isOnline) {
      throw new Error("NETWORK_ERROR");
    }
    if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
      const session = createMockSession();
      // Si el interruptor de sesión vencida está activo, pone el deadline en el pasado
      if (this.sessionExpired) {
        session.absoluteDeadline = new Date(Date.now() - 1000).toISOString();
      }
      return session;
    }
    throw new Error("Credenciales inválidas");
  }

  async scanOrder(payload: string): Promise<ScanOutcome> {
    await mockDelay();
    if (!this.isOnline) {
      return { kind: "NETWORK_ERROR" };
    }
    // F7-QR-DESCONOCIDO o cualquier payload no reconocido
    if (payload === "F7-QR-DESCONOCIDO") {
      return { kind: "NOT_FOUND" };
    }
    const order = FIXTURES[payload];
    if (order) {
      return { kind: "FOUND", order };
    }
    // Payload inválido
    return { kind: "INVALID_PAYLOAD" };
  }

  async confirmDelivery(orderToken: string): Promise<ConfirmDeliveryResult> {
    await mockDelay();
    if (!this.isOnline) {
      throw new Error("NETWORK_ERROR");
    }
    if (this.confirmMode === "ERROR") {
      return { ok: false, reason: "Entrega rechazada por el sistema" };
    }
    if (this.confirmMode === "ALREADY_REGISTERED") {
      return { ok: false, reason: "La entrega ya había sido registrada" };
    }
    return { ok: true, deliveredAt: new Date().toISOString() };
  }

  async getMyRoute(filter: "today" | "upcoming"): Promise<RouteItemDTO[]> {
    await mockDelay();
    if (!this.isOnline) {
      throw new Error("NETWORK_ERROR");
    }
    if (this.routeMode === "ERROR") {
      throw new Error("ROUTE_ERROR");
    }
    if (this.routeMode === "EMPTY") {
      return [];
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    // Fase 1.5: los items con promisedDate null se agrupan al final (no se filtran)
    const withDate = MOCK_ROUTE_ITEMS.filter((item) => item.promisedDate !== null);
    const withoutDate = MOCK_ROUTE_ITEMS.filter((item) => item.promisedDate === null);

    let filtered: RouteItemDTO[];
    if (filter === "today") {
      filtered = withDate.filter((item) => {
        const date = new Date(item.promisedDate!);
        return date < endOfToday;
      });
    } else {
      filtered = withDate.filter((item) => {
        const date = new Date(item.promisedDate!);
        return date >= endOfToday;
      });
    }

    // Ordenar por fecha ascendente
    filtered.sort((a, b) => {
      const da = a.promisedDate ? new Date(a.promisedDate).getTime() : Infinity;
      const db = b.promisedDate ? new Date(b.promisedDate).getTime() : Infinity;
      return da - db;
    });

    // Items sin fecha van al final en ambos filtros
    return [...filtered, ...withoutDate];
  }
}

/** Instancia singleton del gateway mock */
export const gateway: MockGateway = new MockGateway();
