// ProfileScreen — datos del instalador, resumen y tiempo del turno, ajustes,
// diagnóstico del dispositivo y cierre de sesión.
// APP-03: cerrar sesión al terminar el turno o al prestar el teléfono (antes vivía en Mi Ruta).
// Sin dinero ni datos de clientes (FR-020): el resumen solo trae conteos.

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  Flashlight,
  Info,
  Keyboard,
  LogOut,
  Monitor,
  Moon,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sun,
  Timer,
  Vibrate,
  Volume2,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { InfoRow } from "../../components/ui/InfoRow";
import { gateway, isMock } from "../../data";
import type { ShiftSummaryDTO } from "../../data/contracts";
import { useSessionStore } from "../../store/session";
import { useThemeStore, type ThemePreference } from "../../store/theme";
import { useScanPrefs, type ScanPrefs } from "../../store/scanPrefs";
import { useInstallStore } from "../../store/install";

const APP_VERSION = "0.1.0";
const WARN_MINUTES = 30;

const THEMES: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
];

const SCAN_SETTINGS: { key: keyof ScanPrefs; icon: LucideIcon; label: string; hint: string }[] = [
  { key: "vibrate", icon: Vibrate, label: "Vibrar al leer", hint: "Confirma la lectura sin mirar la pantalla." },
  { key: "sound", icon: Volume2, label: "Sonido al leer", hint: "Un tono corto al reconocer el código." },
  { key: "torchOnOpen", icon: Flashlight, label: "Linterna al abrir", hint: "Para lugares oscuros, si el teléfono la tiene." },
  { key: "manualFirst", icon: Keyboard, label: "Captura manual primero", hint: "Muestra el campo para escribir el código." },
];

function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <h2
        style={{
          fontSize: "12px",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--ink-muted)",
          margin: "0 4px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

const rowDivider = { borderTop: "1px solid var(--border-hairline)" } as const;

// ---------------------------------------------------------------------------
// 1. Resumen del turno
// ---------------------------------------------------------------------------

function Stat({ value, label, icon: Icon, testId, warn }: { value: number; label: string; icon: LucideIcon; testId: string; warn?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "14px 8px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: warn ? "var(--state-blocked-bg)" : "var(--surface-2)",
        color: warn ? "var(--state-blocked-ink)" : "var(--ink-strong)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        textAlign: "center",
      }}
    >
      <Icon size={18} aria-hidden="true" />
      <span data-testid={testId} className="tabular" style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: "12px", fontWeight: 600, color: warn ? "inherit" : "var(--ink-muted)" }}>{label}</span>
    </div>
  );
}

function ShiftSummary({
  summary,
  state,
  onRetry,
}: {
  summary: ShiftSummaryDTO | null;
  state: "loading" | "ready" | "error";
  onRetry: () => void;
}) {
  if (state === "loading" && !summary) {
    return <div data-testid="summary-loading" aria-busy="true" className="pf-card skeleton-pulse" style={{ height: "112px" }} />;
  }
  if (state === "error" && !summary) {
    return (
      <div data-testid="summary-error" className="pf-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <AlertTriangle size={20} aria-hidden="true" style={{ color: "var(--ink-muted)", flexShrink: 0 }} />
        <p style={{ flex: 1, margin: 0, fontSize: "14px", color: "var(--ink-base)" }}>No se pudo cargar el resumen.</p>
        <Button variant="secondary" onClick={onRetry} data-testid="summary-retry">
          Reintentar
        </Button>
      </div>
    );
  }
  if (!summary) return null;
  return (
    <div data-testid="shift-summary" className="pf-card" style={{ padding: "12px", display: "flex", gap: "8px" }}>
      <Stat value={summary.deliveredToday} label="Entregadas hoy" icon={PackageCheck} testId="summary-delivered" />
      <Stat value={summary.pendingToday} label="Pendientes" icon={Clock} testId="summary-pending" />
      <Stat value={summary.overdue} label="Vencidas" icon={AlertTriangle} testId="summary-overdue" warn={summary.overdue > 0} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Tiempo de sesión en vivo
// ---------------------------------------------------------------------------

function SessionTimer({ startedAt, deadline }: { startedAt: string; deadline: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const start = new Date(startedAt).getTime();
  const end = new Date(deadline).getTime();
  const remaining = end - now;
  const progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const warn = remaining <= WARN_MINUTES * 60_000;

  return (
    <div data-testid="session-timer" className="pf-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          aria-hidden="true"
          style={{
            width: "40px",
            height: "40px",
            minWidth: "40px",
            borderRadius: "var(--radius-full)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: warn ? "var(--state-warning-bg)" : "var(--surface-2)",
            color: warn ? "var(--state-warning-ink)" : "var(--ink-base)",
          }}
        >
          <Timer size={20} />
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-muted)" }}>Tiempo restante de sesión</p>
          <p data-testid="session-remaining" className="tabular" style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--ink-strong)" }}>
            Quedan {formatRemaining(remaining)}
          </p>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Avance del turno"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        style={{ height: "8px", borderRadius: "var(--radius-full)", backgroundColor: "var(--surface-2)", overflow: "hidden" }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: "var(--radius-full)",
            backgroundColor: warn ? "var(--state-warning-border)" : "var(--brand-bg)",
            transition: "width var(--duration-enter) var(--ease-out)",
          }}
        />
      </div>
      <div className="tabular" style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--ink-muted)" }}>
        <span>Inicio {formatTime(startedAt)}</span>
        <span data-testid="profile-deadline">Vence {formatTime(deadline)}</span>
      </div>
      {warn && (
        <p
          role="status"
          data-testid="session-warning"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            margin: 0,
            padding: "10px 12px",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: 1.4,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--state-warning-border)",
            backgroundColor: "var(--state-warning-bg)",
            color: "var(--state-warning-ink)",
          }}
        >
          <AlertTriangle size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }} />
          La sesión está por vencer. Termine la entrega en curso; después tendrá que volver a iniciar sesión.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Ajustes
// ---------------------------------------------------------------------------

function Switch({ checked, onChange, icon: Icon, label, hint, testId, first }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: LucideIcon;
  label: string;
  hint: string;
  testId: string;
  first?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      style={{
        width: "100%",
        minHeight: "60px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        border: "none",
        ...(first ? {} : rowDivider),
        backgroundColor: "transparent",
        color: "var(--ink-strong)",
        textAlign: "left",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      <Icon size={20} aria-hidden="true" style={{ color: "var(--ink-muted)", flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>{label}</span>
        <span style={{ display: "block", fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.35 }}>{hint}</span>
      </span>
      <span
        aria-hidden="true"
        style={{
          width: "46px",
          height: "28px",
          minWidth: "46px",
          borderRadius: "var(--radius-full)",
          padding: "3px",
          boxSizing: "border-box",
          backgroundColor: checked ? "var(--brand-bg)" : "var(--surface-3)",
          border: `1px solid ${checked ? "var(--brand-bg)" : "var(--border-strong)"}`,
          display: "flex",
          justifyContent: checked ? "flex-end" : "flex-start",
          transition: "background-color var(--duration-press) var(--ease-out)",
        }}
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--surface-card)",
            boxShadow: "var(--shadow-1)",
          }}
        />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// 4. Diagnóstico del dispositivo
// ---------------------------------------------------------------------------

type CameraPermission = "granted" | "denied" | "prompt" | "unknown";

const CAMERA_TEXT: Record<CameraPermission, string> = {
  granted: "Permitida",
  denied: "Bloqueada",
  prompt: "Sin solicitar",
  unknown: "Sin verificar",
};

function useCameraPermission() {
  const [perm, setPerm] = useState<CameraPermission>("unknown");
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const update = () => status && setPerm(status.state as CameraPermission);
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((s) => {
        status = s;
        update();
        s.addEventListener("change", update);
      })
      .catch(() => setPerm("unknown"));
    return () => status?.removeEventListener("change", update);
  }, []);

  const request = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach((t) => t.stop());
      setPerm("granted");
    } catch {
      setPerm("denied");
    }
  };
  return { perm, request };
}

function DiagRow({ icon: Icon, label, value, ok, action, first }: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  ok: boolean | null;
  action?: ReactNode;
  first?: boolean;
}) {
  const StateIcon = ok === null ? Info : ok ? CheckCircle2 : AlertTriangle;
  const tone = ok === null ? "neutral" : ok ? "cleared" : "warning";
  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", ...(first ? {} : rowDivider) }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Icon size={20} aria-hidden="true" style={{ color: "var(--ink-muted)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: "15px", fontWeight: 600, color: "var(--ink-strong)" }}>{label}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "13px",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            backgroundColor: `var(--state-${tone}-bg)`,
            color: `var(--state-${tone}-ink)`,
          }}
        >
          <StateIcon size={14} aria-hidden="true" />
          {value}
        </span>
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ProfileScreen() {
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const logout = useSessionStore((s) => s.logout);
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const prefs = useScanPrefs();
  const installed = useInstallStore((s) => s.installed);
  const canInstall = useInstallStore((s) => s.promptEvent !== null);
  const install = useInstallStore((s) => s.install);
  const camera = useCameraPermission();
  const [confirming, setConfirming] = useState(false);

  const [summary, setSummary] = useState<ShiftSummaryDTO | null>(null);
  const [summaryState, setSummaryState] = useState<"loading" | "ready" | "error">("loading");
  const [latency, setLatency] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [testFailed, setTestFailed] = useState(false);

  // Una sola consulta sirve para el resumen y para medir la conexión.
  const loadSummary = useCallback(async (): Promise<boolean> => {
    setSummaryState("loading");
    const t0 = performance.now();
    try {
      const s = await gateway.getShiftSummary();
      setLatency(Math.round(performance.now() - t0));
      setSummary(s);
      setSummaryState("ready");
      return true;
    } catch {
      setSummaryState("error");
      return false;
    }
  }, []);

  useEffect(() => {
    if (isOnline) void loadSummary();
    else setSummaryState("error");
  }, [isOnline, loadSummary]);

  const testConnection = async () => {
    setTesting(true);
    setTestFailed(false);
    setLatency(null);
    const ok = await loadSummary();
    setTestFailed(!ok);
    setTesting(false);
  };

  if (!session) return null;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const serverOk = !isOnline || testFailed ? false : latency !== null ? true : null;
  const serverText = !isOnline ? "Sin conexión" : testFailed ? "Sin respuesta" : latency !== null ? `${latency} ms` : "Sin probar";

  return (
    <div data-testid="profile-screen" className="pf-enter" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Identidad */}
      <div className="pf-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
        <span
          aria-hidden="true"
          style={{
            width: "56px",
            height: "56px",
            minWidth: "56px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--brand-soft-bg)",
            color: "var(--brand-ink-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontWeight: 800,
          }}
        >
          {initials(session.fullName)}
        </span>
        <div style={{ minWidth: 0 }}>
          <p data-testid="profile-name" style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--ink-strong)", overflowWrap: "anywhere" }}>
            {session.fullName}
          </p>
          <p style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--ink-muted)", margin: "2px 0 0" }}>
            <ShieldCheck size={16} aria-hidden="true" />
            {session.role === "ADMIN" ? "Administrador" : "Instalador"}
          </p>
        </div>
      </div>

      {/* 1 + 2. Turno */}
      <Section title="Mi turno">
        <ShiftSummary summary={summary} state={summaryState} onRetry={() => void loadSummary()} />
        <SessionTimer startedAt={session.sessionStartedAt} deadline={session.absoluteDeadline} />
      </Section>

      {/* 3. Ajustes */}
      <Section title="Ajustes">
        <div className="pf-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p id="theme-label" style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--ink-strong)" }}>
            Apariencia
          </p>
          <div
            role="radiogroup"
            aria-labelledby="theme-label"
            style={{ display: "flex", padding: "4px", gap: "4px", borderRadius: "var(--radius-xl)", backgroundColor: "var(--surface-2)" }}
          >
            {THEMES.map(({ value, label, icon: Icon }) => {
              const active = preference === value;
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={active}
                  data-testid={`theme-${value}`}
                  onClick={() => setPreference(value)}
                  className="pf-pressable"
                  style={{
                    flex: 1,
                    minHeight: "44px",
                    border: "none",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: active ? "var(--surface-card)" : "transparent",
                    boxShadow: active ? "var(--shadow-1)" : "none",
                    color: active ? "var(--ink-strong)" : "var(--ink-muted)",
                    fontSize: "14px",
                    fontWeight: active ? 700 : 500,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pf-card" style={{ overflow: "hidden" }} aria-label="Ajustes de escaneo" role="group">
          {SCAN_SETTINGS.map(({ key, icon, label, hint }, i) => (
            <Switch
              key={key}
              first={i === 0}
              checked={prefs[key]}
              onChange={(v) => prefs.set(key, v)}
              icon={icon}
              label={label}
              hint={hint}
              testId={`pref-${key}`}
            />
          ))}
        </div>
      </Section>

      {/* 4. Diagnóstico */}
      <Section title="Diagnóstico">
        <div data-testid="diagnostics" className="pf-card" style={{ overflow: "hidden" }}>
          <DiagRow
            first
            icon={Camera}
            label="Cámara"
            value={CAMERA_TEXT[camera.perm]}
            ok={camera.perm === "granted" ? true : camera.perm === "denied" ? false : null}
            action={
              camera.perm === "denied" ? (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.45 }}>
                  Actívela desde el candado de la barra de direcciones o en los ajustes del navegador.
                </p>
              ) : camera.perm !== "granted" ? (
                <Button variant="secondary" fullWidth onClick={() => void camera.request()} data-testid="button-camera-permission" icon={<Camera size={18} aria-hidden="true" />}>
                  Permitir cámara
                </Button>
              ) : undefined
            }
          />
          <DiagRow
            icon={isOnline ? Wifi : WifiOff}
            label="Servidor"
            value={<span data-testid="diag-server">{serverText}</span>}
            ok={serverOk}
            action={
              <Button
                variant="secondary"
                fullWidth
                loading={testing}
                disabled={!isOnline}
                onClick={() => void testConnection()}
                data-testid="button-test-connection"
                icon={<RefreshCw size={18} aria-hidden="true" />}
              >
                {testing ? "Probando…" : "Probar conexión"}
              </Button>
            }
          />
          <DiagRow
            icon={Smartphone}
            label="App instalada"
            value={installed ? "Sí" : "No"}
            ok={installed ? true : null}
            action={
              installed ? undefined : canInstall ? (
                <Button variant="secondary" fullWidth onClick={() => void install()} data-testid="button-install" icon={<Download size={18} aria-hidden="true" />}>
                  Instalar app
                </Button>
              ) : (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.45 }}>
                  Desde el menú del navegador elija «Agregar a pantalla de inicio».
                </p>
              )
            }
          />
          <div style={{ ...rowDivider }}>
            <InfoRow icon={Info} label="Versión" last>
              <span className="tabular">
                {APP_VERSION}
                {isMock ? " · datos de demostración" : ""}
              </span>
            </InfoRow>
          </div>
        </div>
      </Section>

      {/* Cerrar sesión, con confirmación para evitar toques accidentales */}
      <div className="pf-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {confirming ? (
          <>
            <p style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "var(--ink-strong)", lineHeight: 1.45 }}>
              ¿Cerrar sesión? Tendrá que volver a ingresar su correo y contraseña.
            </p>
            <Button fullWidth onClick={handleLogout} data-testid="button-logout-confirm" icon={<LogOut size={18} aria-hidden="true" />}>
              Sí, cerrar sesión
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setConfirming(false)} data-testid="button-logout-cancel">
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setConfirming(true)}
            data-testid="button-logout"
            icon={<LogOut size={18} aria-hidden="true" />}
          >
            Cerrar sesión
          </Button>
        )}
      </div>
    </div>
  );
}
