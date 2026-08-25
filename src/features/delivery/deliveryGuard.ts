// deliveryGuard.ts — LA FUNCIÓN MÁS IMPORTANTE DEL REPO.
// Constitution Principle I: Candado de Entrega (NON-NEGOTIABLE).
//
// ALLOW solo si TODO simultáneamente:
//   sesión INSTALLER válida dentro de 12h + online + lectura viva
//   + status READY_FOR_DELIVERY + balanceDue === "0.00" exacto
//
// Todo lo demás es DENY. El valor por defecto es DENY_INDETERMINATE.

import type { GuardDecision, GuardInput } from "../../data/contracts";

/** Tiempo máximo para considerar una lectura "viva" (60 segundos) */
const READ_FRESHNESS_MS = 60_000;

export function evaluateDeliveryGuard(input: GuardInput): GuardDecision {
  const { session, isOnline, order, readAt, now } = input;

  // 1. Sesión válida
  if (!session) return "DENY_INDETERMINATE";
  if (session.role !== "INSTALLER") return "DENY_INDETERMINATE";

  const nowMs = new Date(now).getTime();
  const deadlineMs = new Date(session.absoluteDeadline).getTime();
  if (nowMs >= deadlineMs) return "DENY_INDETERMINATE";

  // 2. Online
  if (!isOnline) return "DENY_INDETERMINATE";

  // 3. Lectura viva (no stale)
  const readAtMs = new Date(readAt).getTime();
  if (nowMs - readAtMs > READ_FRESHNESS_MS) return "DENY_INDETERMINATE";

  // 4. Status entregable
  if (order.status !== "READY_FOR_DELIVERY") return "DENY_NOT_DELIVERABLE";

  // 5. Saldo exactamente "0.00"
  if (order.balanceDue === null) return "DENY_INDETERMINATE";
  if (order.balanceDue === "0.00") return "ALLOW";

  // Saldo negativo (sobrepago/inconsistencia) → indeterminado
  if (order.balanceDue.startsWith("-")) return "DENY_INDETERMINATE";

  // Saldo > 0 → deuda
  return "DENY_DEBT";
}
