// AppShell — header 56px + content + bottom nav 64px.
// FR-020: header persistente que nunca muestra cliente ni saldo.
// FR-026: SessionExpiredModal integrado.
// Fase 1.5: botón [DEMO] en header + UpdateToast integrado.

import { type ReactNode, useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "../feedback/OfflineBanner";
import { SessionExpiredModal } from "../feedback/SessionExpiredModal";
import { UpdateToast } from "../feedback/UpdateToast";
import { useDemoStore } from "../../store/demo";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const [tick, setTick] = useState(0);
  const updateAvailable = useDemoStore((s) => s.updateAvailable);

  // Verificar expiración de sesión cada segundo (research.md R7)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {!isLogin && <OfflineBanner />}
      <header
        data-testid="app-header"
        style={{
          height: "var(--header-height)",
          minHeight: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          backgroundColor: "var(--surface-0)",
          borderBottom: "1px solid var(--border-hairline)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            data-testid="logo-placeholder"
            style={{
              width: "32px",
              height: "32px",
              maxWidth: "40px",
              maxHeight: "40px",
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: "var(--ink-muted)",
            }}
          >
            [LOGO]
          </div>
          {/* Botón [DEMO] discreto — Fase 1.5 */}
          <Link
            to="/demo"
            data-testid="button-demo"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--ink-muted)",
              textDecoration: "none",
              padding: "4px 8px",
              border: "1px solid var(--border-hairline)",
            }}
          >
            [DEMO]
          </Link>
        </div>
        <ConnectionIndicator />
      </header>
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: isLogin ? "16px" : "calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px)",
        }}
      >
        {children}
      </main>
      {/* UpdateToast — Fase 1.5 */}
      {!isLogin && <UpdateToast visible={updateAvailable} onUpdate={handleUpdate} />}
      {!isLogin && <BottomNav />}
      <SessionExpiredModal key={tick} />
    </div>
  );
}
