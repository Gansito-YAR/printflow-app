// BottomNav — dos destinos: Escanear, Mi Ruta.
// Constitution Principle IV: 64px + safe-area-inset-bottom.

import { NavLink } from "react-router-dom";

export function BottomNav() {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "64px",
    minHeight: "var(--hitbox-min)",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--ink-strong)",
    textDecoration: "none",
    borderTop: isActive ? "4px solid var(--border-strong)" : "1px solid var(--border-hairline)",
    backgroundColor: "var(--surface-0)",
  });

  return (
    <nav
      data-testid="bottom-nav"
      style={{
        display: "flex",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: "var(--safe-area-bottom)",
        backgroundColor: "var(--surface-0)",
        zIndex: 100,
      }}
    >
      <NavLink to="/escanear" style={linkStyle} data-testid="nav-escanear">
        Escanear
      </NavLink>
      <NavLink to="/mi-ruta" style={linkStyle} data-testid="nav-mi-ruta">
        Mi Ruta
      </NavLink>
    </nav>
  );
}
