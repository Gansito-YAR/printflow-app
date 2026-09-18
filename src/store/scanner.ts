// PrintFlow AI — scanner slice (Zustand)
// Estado del escáner: soporte de linterna y permiso de cámara.
// En producción lo escribe la API de cámara real.
// El modo demo escribe aquí cuando está activo.

import { create } from "zustand";

interface ScannerState {
  supportsTorch: boolean;
  cameraPermissionDenied: boolean;
  setSupportsTorch: (v: boolean) => void;
  setCameraPermissionDenied: (v: boolean) => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  supportsTorch: true,
  cameraPermissionDenied: false,
  setSupportsTorch: (v) => set({ supportsTorch: v }),
  setCameraPermissionDenied: (v) => set({ cameraPermissionDenied: v }),
}));
