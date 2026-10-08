// PrintFlow AI — session.ts
// Store de Zustand para sesión y conexión.
// Constitution Principle I: el candado consume este store.
// A.3: sin imports de demo. El demo escribe aquí, no al revés.
// Fase 2 (APP-03): estado de rehidratación, sesión revocada por el servidor y
// cierre real en Supabase mediante un "hook" que registra src/data/session.ts
// (así este store no importa la capa de datos y no hay dependencia circular).

import { create } from "zustand";
import type { SessionDTO } from "../data/contracts";

/** EXPIRED: venció el turno de 12 h. REVOKED: el servidor cerró la sesión (turno o cuenta desactivada). */
export type RevokedReason = "EXPIRED" | "REVOKED";

let signOutHook: (() => Promise<void>) | null = null;

/** La capa de datos registra aquí cómo cerrar la sesión en el servidor. */
export function setSignOutHook(hook: (() => Promise<void>) | null): void {
  signOutHook = hook;
}

interface SessionState {
  session: SessionDTO | null;
  /** "checking" mientras se rehidrata la sesión guardada al abrir la app. */
  status: "checking" | "ready";
  revokedReason: RevokedReason | null;
  isOnline: boolean;
  login: (session: SessionDTO) => void;
  /** Cierra la sesión local y, si hay capa real, también en el servidor. */
  logout: () => void;
  /** Cierre local sin avisar al servidor (cuando el propio servidor ya la cerró). */
  clearLocal: () => void;
  revoke: (reason: RevokedReason) => void;
  setStatus: (status: "checking" | "ready") => void;
  setOnline: (online: boolean) => void;
  getEffectiveOnline: () => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  status: "ready",
  revokedReason: null,
  isOnline: navigator.onLine,
  login: (session) => set({ session, revokedReason: null, status: "ready" }),
  logout: () => {
    set({ session: null, revokedReason: null });
    void signOutHook?.();
  },
  clearLocal: () => set({ session: null, revokedReason: null }),
  revoke: (reason) => {
    if (get().session) set({ revokedReason: reason });
  },
  setStatus: (status) => set({ status }),
  setOnline: (online) => set({ isOnline: online }),
  getEffectiveOnline: () => get().isOnline,
}));

/** Sesión que el candado puede usar: null si el servidor la revocó. */
export function usableSession(state: Pick<SessionState, "session" | "revokedReason">): SessionDTO | null {
  return state.revokedReason ? null : state.session;
}

// Listeners para online/offline reales del navegador
if (typeof window !== "undefined") {
  window.addEventListener("online", () => useSessionStore.getState().setOnline(true));
  window.addEventListener("offline", () => useSessionStore.getState().setOnline(false));
}
