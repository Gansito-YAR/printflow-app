// PrintFlow AI — contracts.ts
// Tipos de datos del contrato. NO modificar sin aprobación de Isaías.
// Constitution Principle II: Money como string, nunca number.

/** Dinero como string decimal de 2 posiciones. Ej: "0.00", "1250.50" */
export type Money = string;

/** Estado del pedido en el pipeline de producción */
export type OrderStatus =
  | "PENDING_DEPOSIT"
  | "IN_PRODUCTION"
  | "READY_FOR_DELIVERY"
  | "DELIVERED";

/** Resultado de evaluateDeliveryGuard. Determina qué panel se renderiza. */
export type GuardDecision =
  | "ALLOW"
  | "DENY_DEBT"
  | "DENY_INDETERMINATE"
  | "DENY_NOT_DELIVERABLE";

/** Rol del usuario */
export type UserRole = "INSTALLER" | "ADMIN";

/** Sesión del instalador */
export interface SessionDTO {
  userToken: string;
  fullName: string;
  role: UserRole;
  sessionStartedAt: string; // ISO 8601
  absoluteDeadline: string; // ISO 8601 (sessionStartedAt + 12h, no renovable)
}

/** Resultado de escanear un QR */
export type ScanOutcome =
  | { kind: "FOUND"; order: ScannedOrderDTO }
  | { kind: "NOT_FOUND" }
  | { kind: "NETWORK_ERROR" }
  | { kind: "INVALID_PAYLOAD" };

/** Pedido escaneado desde QR */
export interface ScannedOrderDTO {
  orderToken: string; // opaco, nunca el id real
  customerLabel: string; // sintético: [CLIENTE DEMO 01]
  productLabel: string; // sintético: [LONA 2×3 M — DEMO]
  status: OrderStatus;
  balanceDue: Money | null; // null = indeterminado, NUNCA cero
}

/** Item de "Mi Ruta". ⚠️ NO contiene campos de dinero. */
export interface RouteItemDTO {
  routeItemToken: string; // opaco
  productLabel: string; // sintético
  promisedDate: string | null; // ISO 8601, null = datos incompletos
}

/** Resultado de confirmar entrega */
export type ConfirmDeliveryResult =
  | { ok: true; deliveredAt: string }
  | { ok: false; reason: string };

/** Parámetros de entrada para evaluateDeliveryGuard */
export interface GuardInput {
  session: SessionDTO | null;
  isOnline: boolean;
  order: ScannedOrderDTO;
  readAt: string; // ISO 8601 — timestamp del escaneo
  now: string; // ISO 8601 — timestamp actual
}
