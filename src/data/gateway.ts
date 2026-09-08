// PrintFlow AI — gateway.ts
// Interfaz única entre la PWA y el backend.
// En Fase 1: implementada con mocks. En Fase 2: implementada con fetch a Supabase.
// Constitution Principle V: sin fetch, sin Supabase en Fase 1.

import type {
  SessionDTO,
  ScanOutcome,
  ConfirmDeliveryResult,
  RouteItemDTO,
} from "./contracts";

export interface PrintflowGateway {
  signIn(email: string, password: string): Promise<SessionDTO>;
  scanOrder(payload: string): Promise<ScanOutcome>;
  confirmDelivery(orderToken: string): Promise<ConfirmDeliveryResult>;
  getMyRoute(filter: "today" | "upcoming"): Promise<RouteItemDTO[]>;
}
