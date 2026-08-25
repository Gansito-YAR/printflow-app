// PrintFlow AI — demo slice (Zustand)
// Fase 1.5: Toda la lógica de demo vive aquí, aislada de session.
// Debe poder borrarse en un solo commit cuando se conecte la API real.

import { create } from "zustand";

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

  // Setters
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
  supportsTorch: true, // encendido por defecto en modo demo
  cameraPermissionDenied: false,
  updateAvailable: false,

  setOffline: (v) => set({ offline: v }),
  setSessionExpired: (v) => set({ sessionExpired: v }),
  setConfirmError: (v) => set({ confirmError: v }),
  setConfirmAlready: (v) => set({ confirmAlready: v }),
  setRouteEmpty: (v) => set({ routeEmpty: v }),
  setRouteError: (v) => set({ routeError: v }),
  setCrash: (v) => set({ crash: v }),
  setSupportsTorch: (v) => set({ supportsTorch: v }),
  setCameraPermissionDenied: (v) => set({ cameraPermissionDenied: v }),
  setUpdateAvailable: (v) => set({ updateAvailable: v }),

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
