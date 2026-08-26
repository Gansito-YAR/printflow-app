// DemoScreen — pantalla /demo accesible en producción.
// Fase 1.5: permite alcanzar todos los estados sin DevTools.
// Constitution Principle IV: sin color, misma disciplina que el resto.

import { useNavigate } from "react-router-dom";
import { useDemoStore } from "../../store/demo";
import { useSessionStore } from "../../store/session";
import { gateway } from "../../data/mocks/mockGateway";
import { FIXTURE_LIST } from "../../data/mocks/fixtures";
import { CrashTrigger } from "./CrashTrigger";

interface ToggleProps {
  label: string;
  testId: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, testId, value, onChange }: ToggleProps) {
  return (
    <label
      data-testid={testId}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-hairline)",
        cursor: "pointer",
        minHeight: "48px",
      }}
    >
      <span style={{ fontSize: "14px", color: "var(--ink-strong)" }}>{label}</span>
      <span
        style={{
          width: "48px",
          height: "24px",
          border: "2px solid var(--border-strong)",
          backgroundColor: value ? "var(--ink-strong)" : "var(--surface-0)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: value ? "26px" : "2px",
            width: "16px",
            height: "16px",
            backgroundColor: value ? "var(--surface-0)" : "var(--ink-strong)",
            transition: "left 0.15s",
          }}
        />
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: "none" }}
      />
    </label>
  );
}

export function DemoScreen() {
  const navigate = useNavigate();
  const demo = useDemoStore();
  const session = useSessionStore((s) => s.session);
  const logout = useSessionStore((s) => s.logout);

  // Sincronizar el gateway con los interruptores del demo
  const syncGateway = () => {
    gateway.setOnline(!demo.offline);
    gateway.setConfirmMode(demo.getConfirmMode());
    gateway.setRouteMode(demo.getRouteMode());
    gateway.setSessionExpired(demo.sessionExpired);
  };

  const handleFixture = (fixtureId: string) => {
    syncGateway();
    if (fixtureId === "F7-QR-DESCONOCIDO") {
      navigate(`/resultado/F7-QR-DESCONOCIDO`);
      return;
    }
    navigate(`/resultado/${fixtureId}`);
  };

  const handleToggleOffline = (v: boolean) => {
    demo.setOffline(v);
    gateway.setOnline(!v);
  };

  const handleToggleSessionExpired = (v: boolean) => {
    demo.setSessionExpired(v);
    gateway.setSessionExpired(v);
  };

  const handleToggleConfirmError = (v: boolean) => {
    demo.setConfirmError(v);
    if (v) demo.setConfirmAlready(false);
    gateway.setConfirmMode(demo.getConfirmMode());
  };

  const handleToggleConfirmAlready = (v: boolean) => {
    demo.setConfirmAlready(v);
    if (v) demo.setConfirmError(false);
    gateway.setConfirmMode(demo.getConfirmMode());
  };

  const handleToggleRouteEmpty = (v: boolean) => {
    demo.setRouteEmpty(v);
    if (v) demo.setRouteError(false);
    gateway.setRouteMode(demo.getRouteMode());
  };

  const handleToggleRouteError = (v: boolean) => {
    demo.setRouteError(v);
    if (v) demo.setRouteEmpty(false);
    gateway.setRouteMode(demo.getRouteMode());
  };

  const handleCrash = () => {
    demo.setCrash(true);
    // El error se lanza en el render via CrashTrigger, no aquí
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Estado actual para el Bloque C
  const minutesLeft = session
    ? Math.max(0, Math.round((new Date(session.absoluteDeadline).getTime() - Date.now()) / 60000))
    : 0;

  // CrashTrigger: lanza error durante el render si el interruptor está activo
  // ErrorBoundary solo atrapa errores de render, no de event handlers
  if (demo.crash) {
    return <CrashTrigger shouldCrash={true} />;
  }

  return (
    <div data-testid="demo-screen" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Banner permanente */}
      <div
        data-testid="demo-banner"
        style={{
          backgroundColor: "var(--surface-3)",
          color: "var(--ink-strong)",
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: 600,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        [DEMO] Datos simulados. Este modo se retira al conectar la API.
      </div>

      <h1 style={{ fontSize: "18px", fontWeight: 700 }}>Modo Demo</h1>

      {/* Bloque A — Escenarios de escaneo */}
      <section data-testid="demo-block-a">
        <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--ink-muted)" }}>
          ESCENARIOS DE ESCANEO
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {FIXTURE_LIST.map((fixture) => (
            <button
              key={fixture.id}
              data-testid={`demo-fixture-${fixture.id}`}
              onClick={() => handleFixture(fixture.id)}
              style={{
                height: "48px",
                minHeight: "var(--hitbox-min)",
                padding: "0 16px",
                backgroundColor: "var(--surface-1)",
                border: "1px solid var(--border-hairline)",
                fontSize: "14px",
                cursor: "pointer",
                color: "var(--ink-strong)",
                textAlign: "left",
              }}
            >
              {fixture.id} · {fixture.label}
            </button>
          ))}
          {/* F8 — Payload inválido */}
          <button
            data-testid="demo-fixture-F8-INVALID"
            onClick={() => navigate("/resultado/TEXTO-BASURA-123")}
            style={{
              height: "48px",
              minHeight: "var(--hitbox-min)",
              padding: "0 16px",
              backgroundColor: "var(--surface-1)",
              border: "1px solid var(--border-hairline)",
              fontSize: "14px",
              cursor: "pointer",
              color: "var(--ink-strong)",
              textAlign: "left",
            }}
          >
            F8 · Payload inválido
          </button>
        </div>
      </section>

      {/* Bloque B — Interruptores de estado global */}
      <section data-testid="demo-block-b">
        <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--ink-muted)" }}>
          INTERRUPTORES DE ESTADO
        </h2>
        <div style={{ border: "1px solid var(--border-hairline)" }}>
          <Toggle label="Simular sin conexión" testId="toggle-offline" value={demo.offline} onChange={handleToggleOffline} />
          <Toggle label="Simular sesión vencida" testId="toggle-session-expired" value={demo.sessionExpired} onChange={handleToggleSessionExpired} />
          <Toggle label="Confirmar entrega falla" testId="toggle-confirm-error" value={demo.confirmError} onChange={handleToggleConfirmError} />
          <Toggle label="Entrega ya registrada" testId="toggle-confirm-already" value={demo.confirmAlready} onChange={handleToggleConfirmAlready} />
          <Toggle label="Mi Ruta vacía" testId="toggle-route-empty" value={demo.routeEmpty} onChange={handleToggleRouteEmpty} />
          <Toggle label="Mi Ruta con error" testId="toggle-route-error" value={demo.routeError} onChange={handleToggleRouteError} />
          <Toggle label="Simular soporte de linterna" testId="toggle-torch" value={demo.supportsTorch} onChange={demo.setSupportsTorch} />
          <Toggle label="Simular permiso de cámara denegado" testId="toggle-camera-denied" value={demo.cameraPermissionDenied} onChange={demo.setCameraPermissionDenied} />
          <Toggle label="Simular nueva versión" testId="toggle-update" value={demo.updateAvailable} onChange={demo.setUpdateAvailable} />
          <button
            data-testid="toggle-crash"
            onClick={handleCrash}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-hairline)",
              cursor: "pointer",
              minHeight: "48px",
              width: "100%",
              backgroundColor: "var(--surface-0)",
              border: "none",
              borderBottomWidth: "1px",
              borderBottomStyle: "solid",
              borderBottomColor: "var(--border-hairline)",
              fontSize: "14px",
              color: "var(--ink-strong)",
              textAlign: "left",
            }}
          >
            Forzar error de React →
          </button>
        </div>
      </section>

      {/* Bloque C — Estado actual */}
      <section data-testid="demo-block-c">
        <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--ink-muted)" }}>
          ESTADO ACTUAL
        </h2>
        <div
          style={{
            padding: "16px",
            border: "1px solid var(--border-hairline)",
            fontSize: "13px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-muted)" }}>Sesión activa:</span>
            <span style={{ fontWeight: 600 }}>{session ? "SÍ" : "NO"}</span>
          </div>
          {session && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Rol:</span>
                <span style={{ fontWeight: 600 }}>{session.role}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Minutos restantes:</span>
                <span style={{ fontWeight: 600 }}>{minutesLeft}</span>
              </div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-muted)" }}>Conexión:</span>
            <span style={{ fontWeight: 600 }}>{demo.offline ? "SIN CONEXIÓN (demo)" : "EN LÍNEA"}</span>
          </div>
        </div>
      </section>

      {/* Cerrar sesión */}
      {session && (
        <button
          data-testid="demo-logout"
          onClick={handleLogout}
          style={{
            height: "48px",
            minHeight: "var(--hitbox-min)",
            padding: "0 16px",
            backgroundColor: "transparent",
            border: "2px solid var(--border-strong)",
            fontSize: "14px",
            cursor: "pointer",
            color: "var(--ink-strong)",
          }}
        >
          Cerrar sesión
        </button>
      )}
    </div>
  );
}
