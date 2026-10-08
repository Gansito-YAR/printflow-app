// PrintFlow AI — lectura de la marca de inicio de sesión del JWT.
// El turno de 12 h se cuenta desde la marca `amr` (método password) que firma
// Supabase, no desde el reloj del teléfono (APP-D-08). Es la misma marca que
// usa la base para cortar el turno (private.login_time()).

interface AmrEntry {
  method?: string;
  timestamp?: number;
}

function decodePayload(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    const payload: unknown = JSON.parse(json);
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Marca del login con contraseña en ISO 8601, o null si el token no la trae. */
export function loginTimestamp(accessToken: string): string | null {
  const payload = decodePayload(accessToken);
  const amr = payload?.amr;
  if (!Array.isArray(amr)) return null;
  const entry = (amr as AmrEntry[]).find((a) => a && a.method === "password" && typeof a.timestamp === "number");
  if (!entry || typeof entry.timestamp !== "number") return null;
  return new Date(entry.timestamp * 1000).toISOString();
}

export const SHIFT_MS = 12 * 60 * 60 * 1000;
