// App.tsx — rutas principales.
// FR-018: ErrorBoundary global.
// Fase 1.5: ruta /demo accesible en producción.

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { LoginScreen } from "./features/auth/LoginScreen";
import { ScannerScreen } from "./features/scanner/ScannerScreen";
import { DeliveryResultScreen } from "./features/delivery/DeliveryResultScreen";
import { MyRouteScreen } from "./features/route/MyRouteScreen";
import { DemoScreen } from "./features/demo/DemoScreen";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route
            path="/escanear"
            element={
              <AppShell>
                <ScannerScreen />
              </AppShell>
            }
          />
          <Route
            path="/resultado/:orderToken"
            element={
              <AppShell>
                <DeliveryResultScreen />
              </AppShell>
            }
          />
          <Route
            path="/mi-ruta"
            element={
              <AppShell>
                <MyRouteScreen />
              </AppShell>
            }
          />
          <Route
            path="/demo"
            element={
              <AppShell>
                <DemoScreen />
              </AppShell>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
