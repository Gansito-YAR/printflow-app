// PrintFlow AI — install.ts
// Instalación como app (PWA). El navegador emite `beforeinstallprompt` una sola
// vez y temprano, así que se captura al arrancar (main.tsx) y Perfil lo usa después.

import { create } from "zustand";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallState {
  installed: boolean;
  promptEvent: InstallPromptEvent | null;
  install: () => Promise<void>;
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

export const useInstallStore = create<InstallState>((set, get) => ({
  installed: typeof window !== "undefined" ? isStandalone() : false,
  promptEvent: null,
  install: async () => {
    const ev = get().promptEvent;
    if (!ev) return;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    set({ promptEvent: null, installed: outcome === "accepted" });
  },
}));

export function initInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useInstallStore.setState({ promptEvent: e as InstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => useInstallStore.setState({ installed: true, promptEvent: null }));
}
