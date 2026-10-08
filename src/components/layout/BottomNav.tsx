// BottomNav — tres destinos de primer nivel: Escanear, Mi Ruta y Perfil.
// Rediseño 1.2.0: icono + etiqueta (nunca solo icono), indicador activo en
// píldora, 64 px + zona segura inferior del teléfono.

import { NavLink } from "react-router-dom";
import { CircleUserRound, Route as RouteIcon, ScanLine, type LucideIcon } from "lucide-react";

const ITEMS: { to: string; label: string; icon: LucideIcon; testId: string }[] = [
  { to: "/escanear", label: "Escanear", icon: ScanLine, testId: "nav-escanear" },
  { to: "/mi-ruta", label: "Mi Ruta", icon: RouteIcon, testId: "nav-mi-ruta" },
  { to: "/perfil", label: "Perfil", icon: CircleUserRound, testId: "nav-perfil" },
];

export function BottomNav() {
  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Navegación principal"
      style={{
        display: "flex",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: "var(--safe-area-bottom)",
        backgroundColor: "var(--surface-card)",
        borderTop: "1px solid var(--border-hairline)",
        zIndex: 100,
      }}
    >
      {ITEMS.map(({ to, label, icon: Icon, testId }) => (
        <NavLink
          key={to}
          to={to}
          data-testid={testId}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            height: "64px",
            textDecoration: "none",
          }}
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden="true"
                className="pf-pressable"
                style={{
                  width: "64px",
                  height: "32px",
                  borderRadius: "var(--radius-full)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? "var(--brand-soft-bg)" : "transparent",
                  color: isActive ? "var(--brand-ink-accent)" : "var(--ink-muted)",
                }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--ink-strong)" : "var(--ink-muted)",
                }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
