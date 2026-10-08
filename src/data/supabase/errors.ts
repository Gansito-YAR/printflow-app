// PrintFlow AI — clasificación de errores del servidor (APP-D-06).
// Mapa cerrado: un error JAMÁS se traduce en una autorización de entrega.

/** La base cerró la sesión: turno de 12 h vencido o cuenta desactivada. */
export class SessionRevokedError extends Error {
  constructor() {
    super("SESSION_REVOKED");
    this.name = "SessionRevokedError";
  }
}

export type ErrorKind = "NETWORK" | "FORBIDDEN" | "UNKNOWN";

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  name?: unknown;
}

export function classify(err: unknown): ErrorKind {
  if (err instanceof SessionRevokedError) return "FORBIDDEN";
  const e = (err ?? {}) as ErrorLike;
  const message = typeof e.message === "string" ? e.message : "";
  const code = typeof e.code === "string" ? e.code : "";
  const name = typeof e.name === "string" ? e.name : "";

  if (message === "PF_FORBIDDEN" || code === "42501") return "FORBIDDEN";
  if (
    err instanceof TypeError ||
    name === "AbortError" ||
    name === "TimeoutError" ||
    /failed to fetch|networkerror|load failed|network request failed|timeout/i.test(message)
  ) {
    return "NETWORK";
  }
  return "UNKNOWN";
}

/** Límite por llamada (APP-D-07): en la calle con mala señal no hay spinner infinito. */
export const REQUEST_TIMEOUT_MS = 10_000;

export function timeoutSignal(ms = REQUEST_TIMEOUT_MS): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), ms);
  return controller.signal;
}
