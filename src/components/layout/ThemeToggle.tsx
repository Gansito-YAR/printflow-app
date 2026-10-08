// ThemeToggle — selector de tema claro / oscuro / sistema.
// Fase 2 §3.5: va en el encabezado, junto al indicador de conexión.
// Rediseño 1.2.0: icono SVG; hitbox 48×48; nombre accesible con el estado actual.

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useThemeStore, type ThemePreference } from "../../store/theme";

const ORDER: ThemePreference[] = ["system", "light", "dark"];

const LABELS: Record<ThemePreference, string> = {
  system: "Tema: sistema",
  light: "Tema: claro",
  dark: "Tema: oscuro",
};

const ICONS: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const Icon = ICONS[preference];

  const cycle = () => {
    const idx = ORDER.indexOf(preference);
    const next = ORDER[(idx + 1) % ORDER.length] ?? "system";
    setPreference(next);
  };

  return (
    <button
      data-testid="theme-toggle"
      aria-label={`${LABELS[preference]}. Cambiar tema`}
      onClick={cycle}
      className="pf-pressable"
      style={{
        width: "48px",
        height: "48px",
        minWidth: "48px",
        border: "none",
        backgroundColor: "transparent",
        color: "var(--ink-base)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-lg)",
        flexShrink: 0,
      }}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}
