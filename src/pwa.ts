// PrintFlow AI — registro del Service Worker y actualizaciones (SRS Fase 4 §5.2).
// registerType "prompt": la versión nueva queda en espera hasta que se aplica aquí.
//   - Sin sesión (pantalla de login): se aplica sola; no hay trabajo que perder.
//   - Con sesión: aparece el aviso "Actualización disponible" (UpdateToast).
// Además se revisa cada hora por si la app queda abierta todo el turno.

import { registerSW } from "virtual:pwa-register";
import { useAppStore } from "./store/app";
import { useSessionStore } from "./store/session";

const CHECK_EVERY_MS = 60 * 60 * 1000;

export function initPwa(): void {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      console.info("[PrintFlow] hay una versión nueva de la app");
      if (!useSessionStore.getState().session) {
        void updateSW(true);
        return;
      }
      useAppStore.getState().setUpdateAvailable(true);
    },
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), CHECK_EVERY_MS);
    },
  });

  useAppStore.setState({ applyUpdate: () => void updateSW(true) });
}
