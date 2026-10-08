// PrintFlow AI — scanPrefs.ts
// Ajustes de escaneo del instalador (pestaña Perfil). Viven solo en el teléfono
// (localStorage), no tocan el servidor ni el candado de entrega.

import { create } from "zustand";

export interface ScanPrefs {
  vibrate: boolean; // vibración al leer un código válido
  sound: boolean; // tono corto al leer un código válido
  torchOnOpen: boolean; // encender la linterna al abrir el escáner (si existe)
  manualFirst: boolean; // abrir directo la captura manual
}

const STORAGE_KEY = "printflow-scan-prefs";
const DEFAULTS: ScanPrefs = { vibrate: true, sound: false, torchOnOpen: false, manualFirst: false };

function read(): ScanPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ScanPrefs>) };
  } catch {
    // localStorage bloqueado o JSON dañado — se usan los valores por defecto
  }
  return DEFAULTS;
}

interface ScanPrefsState extends ScanPrefs {
  set: <K extends keyof ScanPrefs>(key: K, value: ScanPrefs[K]) => void;
}

export const useScanPrefs = create<ScanPrefsState>((set, get) => ({
  ...read(),
  set: (key, value) => {
    set({ [key]: value } as Pick<ScanPrefs, typeof key>);
    const { vibrate, sound, torchOnOpen, manualFirst } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ vibrate, sound, torchOnOpen, manualFirst }));
    } catch {
      // sin persistencia: el ajuste dura hasta recargar
    }
  },
}));

/** Retroalimentación al leer un código válido, según los ajustes. */
export function scanFeedback(): void {
  const { vibrate, sound } = useScanPrefs.getState();
  if (vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(80);
  if (sound) beep();
}

function beep(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1100;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
    osc.onended = () => void ctx.close();
  } catch {
    // audio no disponible — la lectura sigue sin tono
  }
}
