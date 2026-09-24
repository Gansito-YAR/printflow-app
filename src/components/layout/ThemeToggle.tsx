// ThemeToggle — selector de tema claro / oscuro / sistema.
// Fase 2 §3.5: va en el header, junto al indicador de conexión.
// Hitbox ≥48×48, nombre accesible con el estado actual.

import { useThemeStore, type ThemePreference } from "../../store/theme";

const ORDER: ThemePreference[] = ["system", "light", "dark"];

const LABELS: Record<ThemePreference, string> = {
  system: "Tema: sistema",
  light: "Tema: claro",
  dark: "Tema: oscuro",
};

const ICONS: Record<ThemePreference, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};

export function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

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
      style={{
        width: "48px",
        height: "48px",
        minWidth: "48px",
        border: "1px solid var(--border-hairline)",
        backgroundColor: "var(--surface-0)",
        color: "var(--ink-strong)",
        fontSize: "20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-sm)",
        flexShrink: 0,
      }}
    >
      <span aria-hidden="true">{ICONS[preference]}</span>
    </button>
  );
}
