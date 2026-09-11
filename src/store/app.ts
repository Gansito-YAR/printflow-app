// PrintFlow AI — app slice (Zustand)
// Estado de aplicación que en producción escribe el Service Worker.
// El modo demo escribe aquí cuando está activo.

import { create } from "zustand";

interface AppState {
  updateAvailable: boolean;
  setUpdateAvailable: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  updateAvailable: false,
  setUpdateAvailable: (v) => set({ updateAvailable: v }),
}));
