// PrintFlow AI — punto único de acceso a datos (APP-01, APP-D-01).
//   VITE_DATA_SOURCE=mock     → MockGateway (por defecto; habilita /demo)
//   VITE_DATA_SOURCE=supabase → SupabaseGateway (base real)
// Las pantallas importan `gateway` desde aquí, nunca desde mocks/ ni supabase/.

import type { PrintflowGateway } from "./gateway";
import { gateway as mockGateway } from "./mocks/mockGateway";
import { SupabaseGateway, isQrPayload } from "./supabase/supabaseGateway";
import { SessionRevokedError } from "./supabase/errors";
import { useSessionStore } from "../store/session";

export type DataSource = "mock" | "supabase";

// Tolera mayúsculas, espacios y comillas capturados por error en el hosting.
const rawDataSource = import.meta.env.VITE_DATA_SOURCE;
export const dataSource: DataSource =
  (rawDataSource ?? "").trim().replace(/^["']|["']$/g, "").toLowerCase() === "supabase" ? "supabase" : "mock";

export const isMock = dataSource === "mock";

// Diagnóstico de despliegue: Vite fija estas variables al COMPILAR. Si aquí sale
// "mock" en producción, falta VITE_DATA_SOURCE=supabase en el build (o no se redesplegó).
// Nunca se imprime la clave, solo si existe.
console.info("[PrintFlow] fuente de datos:", dataSource, {
  VITE_DATA_SOURCE_recibida: rawDataSource === undefined ? "(no definida al compilar)" : JSON.stringify(rawDataSource),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "(sin configurar)",
  anonKeyConfigurada: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
});

export const supabaseGateway: SupabaseGateway | null = dataSource === "supabase" ? new SupabaseGateway() : null;

export { SessionRevokedError };

/**
 * Cualquier operación que el servidor rechace por sesión (turno vencido o
 * cuenta desactivada) marca la sesión como revocada: aparece el modal de
 * sesión cerrada y el candado deja de tener sesión utilizable (APP-03d).
 */
function withRevocation(inner: PrintflowGateway): PrintflowGateway {
  const guard = async <T>(run: () => Promise<T>): Promise<T> => {
    try {
      return await run();
    } catch (err) {
      if (err instanceof SessionRevokedError) useSessionStore.getState().revoke("REVOKED");
      throw err;
    }
  };
  return {
    signIn: (email, password) => inner.signIn(email, password),
    scanOrder: (payload) => guard(() => inner.scanOrder(payload)),
    confirmDelivery: (token) => guard(() => inner.confirmDelivery(token)),
    getMyRoute: (filter) => guard(() => inner.getMyRoute(filter)),
    getShiftSummary: () => guard(() => inner.getShiftSummary()),
  };
}

export const gateway: PrintflowGateway = supabaseGateway ? withRevocation(supabaseGateway) : mockGateway;

/**
 * Validación local del código leído, antes de navegar al resultado (APP-04a).
 * Con datos reales el QR es un UUID (ARQ-01); con el mock, los tokens de fixtures.
 */
export function isValidPayload(payload: string): boolean {
  const p = payload.trim();
  if (!p) return false;
  return isMock ? true : isQrPayload(p);
}
