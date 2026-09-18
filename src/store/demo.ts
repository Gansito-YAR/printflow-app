// PrintFlow AI — demo slice (Zustand)
// Fase 1.5: Toda la lógica de demo vive aquí, aislada de session.
// Debe poder borrarse en un solo commit cuando se conecte la API real.
// A.3: el demo ESCRIBE en los stores de producción, no al revés.

import { create } from "zustand";
import { useSessionStore } from "./session";
import { useAppStore } from "./app";
import { useScannerStore } from "./scanner";
import { gateway } from "../data/mocks/mockGateway";

type ConfirmMode = "OK" | "ERROR" | "ALREADY_REGISTERED";
type RouteMode = "NORMAL" | "EMPTY" | "ERROR";

interface DemoState {
  // Interruptores
  offline: boolean;
  sessionExpired: boolean;
  confirmError: boolean;
  confirmAlready: boolean;
  routeEmpty: boolean;
  routeError: boolean;
  crash: boolean;
  supportsTorch: boolean;
  cameraPermissionDenied: boolean;
  updateAvailable: boolean;

  // Setters — empujan el valor hacia los stores de producción
  setOffline: (v: boolean) => void;
  setSessionExpired: (v: boolean) => void;
  setConfirmError: (v: boolean) => void;
  setConfirmAlready: (v: boolean) => void;
  setRouteEmpty: (v: boolean) => void;
  setRouteError: (v: boolean) => void;
  setCrash: (v: boolean) => void;
  setSupportsTorch: (v: boolean) => void;
  setCameraPermissionDenied: (v: boolean) => void;
  setUpdateAvailable: (v: boolean) => void;

  // Derivados para el gateway
  getConfirmMode: () => ConfirmMode;
  getRouteMode: () => RouteMode;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  offline: false,
  sessionExpired: false,
  confirmError: false,
  confirmAlready: false,
  routeEmpty: false,
  routeError: false,
  crash: false,
  supportsTorch: true,
  cameraPermissionDenied: false,
  updateAvailable: false,

  setOffline: (v) => {
    set({ offline: v });
    useSessionStore.getState().setOnline(!v);
    gateway.setOnline(!v);
  },
  setSessionExpired: (v) => {
    set({ sessionExpired: v });
    gateway.setSessionExpired(v);
  },
  setConfirmError: (v) => {
    set({ confirmError: v });
    if (v) set({ confirmAlready: false });
    gateway.setConfirmMode(get().confirmError ? "ERROR" : get().confirmAlready ? "ALREADY_REGISTERED" : "OK");
  },
  setConfirmAlready: (v) => {
    set({ confirmAlready: v });
    if (v) set({ confirmError: false });
    gateway.setConfirmMode(get().confirmError ? "ERROR" : get().confirmAlready ? "ALREADY_REGISTERED" : "OK");
  },
  setRouteEmpty: (v) => {
    set({ routeEmpty: v });
    if (v) set({ routeError: false });
    gateway.setRouteMode(get().routeError ? "ERROR" : get().routeEmpty ? "EMPTY" : "NORMAL");
  },
  setRouteError: (v) => {
    set({ routeError: v });
    if (v) set({ routeEmpty: false });
    gateway.setRouteMode(get().routeError ? "ERROR" : get().routeEmpty ? "EMPTY" : "NORMAL");
  },
  setCrash: (v) => set({ crash: v }),
  setSupportsTorch: (v) => {
    set({ supportsTorch: v });
    useScannerStore.getState().setSupportsTorch(v);
  },
  setCameraPermissionDenied: (v) => {
    set({ cameraPermissionDenied: v });
    useScannerStore.getState().setCameraPermissionDenied(v);
  },
  setUpdateAvailable: (v) => {
    set({ updateAvailable: v });
    useAppStore.getState().setUpdateAvailable(v);
  },

  getConfirmMode: () => {
    const s = get();
    if (s.confirmError) return "ERROR";
    if (s.confirmAlready) return "ALREADY_REGISTERED";
    return "OK";
  },
  getRouteMode: () => {
    const s = get();
    if (s.routeError) return "ERROR";
    if (s.routeEmpty) return "EMPTY";
    return "NORMAL";
  },
}));

// A.3: el demo limpia su propio interruptor de sesión vencida cuando
// la sesión se cierra (desde el modal, desde /demo, o desde donde sea).
// Así el próximo login devuelve una sesión normal.
if (typeof window !== "undefined") {
  useSessionStore.subscribe((state, prev) => {
    if (state.session === null && prev.session !== null) {
      useDemoStore.getState().setSessionExpired(false);
      gateway.setSessionExpired(false);
    }
  });
}
