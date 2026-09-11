// PrintFlow AI — session.ts
// Store de Zustand para sesión y conexión.
// Constitution Principle I: el candado consume este store.
// A.3: sin imports de demo. El demo escribe aquí, no al revés.

import { create } from "zustand";
import type { SessionDTO } from "../data/contracts";

interface SessionState {
  session: SessionDTO | null;
  isOnline: boolean;
  login: (session: SessionDTO) => void;
  logout: () => void;
  setOnline: (online: boolean) => void;
  getEffectiveOnline: () => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  isOnline: navigator.onLine,
  login: (session) => set({ session }),
  logout: () => set({ session: null }),
  setOnline: (online) => set({ isOnline: online }),
  getEffectiveOnline: () => get().isOnline,
}));

// Listeners para online/offline reales del navegador
if (typeof window !== "undefined") {
  window.addEventListener("online", () => useSessionStore.getState().setOnline(true));
  window.addEventListener("offline", () => useSessionStore.getState().setOnline(false));
}
