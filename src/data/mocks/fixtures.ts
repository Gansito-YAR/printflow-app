// PrintFlow AI — fixtures.ts
// 7 fixtures mock para probar todos los estados del candado.
// Constitution Principle VI: datos sintéticos, sin PII, sin UUIDs reales.

import type { ScannedOrderDTO, RouteItemDTO, SessionDTO } from "../contracts";

/** Credenciales mock */
export const MOCK_CREDENTIALS = {
  email: "instalador@imprenta.com",
  password: "demo1234",
} as const;

/** Sesión mock válida (12 horas desde ahora) */
export function createMockSession(): SessionDTO {
  const now = new Date();
  const deadline = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  return {
    userToken: "[PAYLOAD_OPACO_DE_SESION]",
    fullName: "[INSTALADOR DEMO]",
    role: "INSTALLER",
    sessionStartedAt: now.toISOString(),
    absoluteDeadline: deadline.toISOString(),
  };
}

/** 7 fixtures mock — uno por cada estado del candado */
export const FIXTURES: Record<string, ScannedOrderDTO> = {
  "F1-LIQUIDADO": {
    orderToken: "[PAYLOAD_OPACO_DE_ORDEN_F1]",
    customerLabel: "[CLIENTE DEMO 01]",
    productLabel: "[LONA 2×3 M — DEMO]",
    status: "READY_FOR_DELIVERY",
    balanceDue: "0.00",
  },
  "F2-CON-DEUDA": {
    orderToken: "[PAYLOAD_OPACO_DE_ORDEN_F2]",
    customerLabel: "[CLIENTE DEMO 02]",
    productLabel: "[VOLANTES 5000 — DEMO]",
    status: "READY_FOR_DELIVERY",
    balanceDue: "1250.50",
  },
  "F3-SALDO-DESCONOCIDO": {
    orderToken: "[PAYLOAD_OPACO_DE_ORDEN_F3]",
    customerLabel: "[CLIENTE DEMO 03]",
    productLabel: "[TARJETAS 1000 — DEMO]",
    status: "READY_FOR_DELIVERY",
    balanceDue: null,
  },
  "F4-SOBREPAGO": {
    orderToken: "[PAYLOAD_OPACO_DE_ORDEN_F4]",
    customerLabel: "[CLIENTE DEMO 04]",
    productLabel: "[BANNER 3×1 M — DEMO]",
    status: "READY_FOR_DELIVERY",
    balanceDue: "-100.00",
  },
  "F5-EN-PRODUCCION": {
    orderToken: "[PAYLOAD_OPACO_DE_ORDEN_F5]",
    customerLabel: "[CLIENTE DEMO 05]",
    productLabel: "[CALENDARIOS 200 — DEMO]",
    status: "IN_PRODUCTION",
    balanceDue: "0.00",
  },
  "F6-YA-ENTREGADO": {
    orderToken: "[PAYLOAD_OPACO_DE_ORDEN_F6]",
    customerLabel: "[CLIENTE DEMO 06]",
    productLabel: "[ETIQUETAS 500 — DEMO]",
    status: "DELIVERED",
    balanceDue: "0.00",
  },
  // F7 es NOT_FOUND — no tiene orden
};

/** Lista de fixtures para el panel de desarrollo */
export const FIXTURE_LIST = [
  { id: "F1-LIQUIDADO", label: "Liquidado y listo" },
  { id: "F2-CON-DEUDA", label: "Con deuda" },
  { id: "F3-SALDO-DESCONOCIDO", label: "Saldo desconocido" },
  { id: "F4-SOBREPAGO", label: "Sobrepago (inconsistencia)" },
  { id: "F5-EN-PRODUCCION", label: "Aún en producción" },
  { id: "F6-YA-ENTREGADO", label: "Ya entregado" },
  { id: "F7-QR-DESCONOCIDO", label: "QR desconocido" },
] as const;

/** Items de ruta mock — sin campos de dinero */
export const MOCK_ROUTE_ITEMS: RouteItemDTO[] = [
  {
    routeItemToken: "[PAYLOAD_OPACO_R1]",
    productLabel: "[LONA 2×3 M — DEMO]",
    promisedDate: new Date(Date.now() - 86400000).toISOString(), // ayer (vencido)
  },
  {
    routeItemToken: "[PAYLOAD_OPACO_R2]",
    productLabel: "[VOLANTES 5000 — DEMO]",
    promisedDate: new Date().toISOString(), // hoy
  },
  {
    routeItemToken: "[PAYLOAD_OPACO_R3]",
    productLabel: "[TARJETAS 1000 — DEMO]",
    promisedDate: new Date(Date.now() + 86400000).toISOString(), // mañana
  },
  {
    routeItemToken: "[PAYLOAD_OPACO_R4]",
    productLabel: "[BANNER 3×1 M — DEMO]",
    promisedDate: new Date(Date.now() + 3 * 86400000).toISOString(), // en 3 días
  },
  {
    routeItemToken: "[PAYLOAD_OPACO_R5]",
    productLabel: "[CALENDARIOS 200 — DEMO]",
    promisedDate: new Date(Date.now() + 7 * 86400000).toISOString(), // en 7 días
  },
  {
    routeItemToken: "[PAYLOAD_OPACO_R6]",
    productLabel: "[ETIQUETAS 500 — DEMO]",
    promisedDate: null, // datos incompletos
  },
];
