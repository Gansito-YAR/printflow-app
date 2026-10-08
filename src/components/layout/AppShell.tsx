// AppShell — encabezado + contenido + navegación inferior.
// FR-020: el encabezado persistente nunca muestra cliente ni saldo.
// FR-026: SessionExpiredModal integrado.
// Rediseño 1.2.0: encabezado limpio con marca y título, fondo de página
// diferenciado de las tarjetas, contenido centrado con ancho legible.

import { type ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { isMock } from "../../data";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "../feedback/OfflineBanner";
import { SessionExpiredModal } from "../feedback/SessionExpiredModal";
import { UpdateToast } from "../feedback/UpdateToast";
import { useAppStore } from "../../store/app";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const updateAvailable = useAppStore((s) => s.updateAvailable);

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--surface-page)" }}>
      <header
        data-testid="app-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "var(--header-height)",
          minHeight: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "0 12px 0 16px",
          backgroundColor: "var(--surface-card)",
          borderBottom: "1px solid var(--border-hairline)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <img
            src="/brand/logo-mark.png"
            alt="Imprenta Escalante"
            data-testid="logo-placeholder"
            width={32}
            height={32}
            style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-strong)" }}>PrintFlow</span>
            <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Entregas</span>
          </div>
          {/* Panel de demostración: solo con datos simulados (APP-D-02). */}
          {isMock && (
            <Link
              to="/demo"
              data-testid="button-demo"
              aria-label="Abrir panel de demostración"
              className="pf-pressable"
              style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", textDecoration: "none" }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "var(--brand-ink-accent)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--brand-soft-bg)",
                }}
              >
                <FlaskConical size={12} aria-hidden="true" />
                DEMO
              </span>
            </Link>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <ConnectionIndicator />
        </div>
      </header>
      {!isLogin && <OfflineBanner />}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "560px",
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "16px",
          paddingBottom: isLogin ? "16px" : "calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 24px)",
        }}
      >
        {children}
      </main>
      {!isLogin && <UpdateToast visible={updateAvailable} onUpdate={handleUpdate} />}
      {!isLogin && <BottomNav />}
      <SessionExpiredModal />
    </div>
  );
}
