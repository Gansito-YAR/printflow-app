// App.tsx — rutas principales.
// FR-018: ErrorBoundary global.
// Fase 1.5: ruta /demo accesible en producción + auth guard en rutas protegidas.

import { type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { LoginScreen } from "./features/auth/LoginScreen";
import { ScannerScreen } from "./features/scanner/ScannerScreen";
import { DeliveryResultScreen } from "./features/delivery/DeliveryResultScreen";
import { MyRouteScreen } from "./features/route/MyRouteScreen";
import { DemoScreen } from "./features/demo/DemoScreen";
import { useSessionStore } from "./store/session";

/** Auth guard — redirige a login si no hay sesión activa */
function Protected({ children }: { children: ReactNode }) {
  const session = useSessionStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route
            path="/escanear"
            element={
              <Protected>
                <AppShell>
                  <ScannerScreen />
                </AppShell>
              </Protected>
            }
          />
          <Route
            path="/resultado/:orderToken"
            element={
              <Protected>
                <AppShell>
                  <DeliveryResultScreen />
                </AppShell>
              </Protected>
            }
          />
          <Route
            path="/mi-ruta"
            element={
              <Protected>
                <AppShell>
                  <MyRouteScreen />
                </AppShell>
              </Protected>
            }
          />
          <Route
            path="/demo"
            element={
              <Protected>
                <AppShell>
                  <DemoScreen />
                </AppShell>
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
