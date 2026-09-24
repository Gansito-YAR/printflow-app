// PrintFlow AI — theme.ts
// Preferencia real del usuario: light | dark | system.
// Fase 2 §3.6: NO vive en el store demo. Persiste en localStorage.
// El script inline de index.html aplica data-theme antes del primer pintado.

import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "printflow-theme";
const THEME_COLOR_LIGHT = "#F8F8F8";
const THEME_COLOR_DARK = "#101010";

function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // localStorage bloqueado (navegación privada) — no romper la app
  }
  return "system";
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(pref: ThemePreference): ResolvedTheme {
  const resolved = pref === "system" ? systemTheme() : pref;
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", pref);
  }
  // Barra de estado del sistema (PWA standalone)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  return resolved;
}

function persist(pref: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // localStorage bloqueado — la preferencia solo dura la sesión
  }
}

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: typeof window === "undefined" ? "system" : readStoredPreference(),
  resolved:
    typeof window === "undefined" ? "light" : applyTheme(readStoredPreference()),
  setPreference: (pref) => {
    persist(pref);
    const resolved = applyTheme(pref);
    set({ preference: pref, resolved });
  },
}));

// Escuchar cambios del SO en vivo: solo aplica cuando la preferencia es "system".
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const { preference } = useThemeStore.getState();
    if (preference === "system") {
      useThemeStore.getState().setPreference("system");
    }
  });
}
