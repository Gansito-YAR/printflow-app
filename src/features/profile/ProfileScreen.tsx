// ProfileScreen — datos del instalador, ajustes de la app y cierre de sesión.
// APP-03: cerrar sesión al terminar el turno o al prestar el teléfono (antes vivía en Mi Ruta).
// Sin dinero ni datos de clientes (FR-020).

import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Info, LogIn, LogOut, Monitor, Moon, ShieldCheck, Sun, Wifi, WifiOff, type LucideIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { InfoRow } from "../../components/ui/InfoRow";
import { isMock } from "../../data";
import { useSessionStore } from "../../store/session";
import { useThemeStore, type ThemePreference } from "../../store/theme";

const APP_VERSION = "0.1.0";

const THEMES: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
];

function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
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

export function ProfileScreen() {
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const logout = useSessionStore((s) => s.logout);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const [confirming, setConfirming] = useState(false);

  if (!session) return null;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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

      {/* Turno */}
      <Section title="Turno">
        <div className="pf-card tabular" style={{ overflow: "hidden" }}>
          <InfoRow icon={LogIn} label="Inicio de sesión">{formatTime(session.sessionStartedAt)}</InfoRow>
          <InfoRow icon={Clock} label="La sesión vence" last>
            <span data-testid="profile-deadline">{formatTime(session.absoluteDeadline)}</span>
          </InfoRow>
        </div>
      </Section>

      {/* Ajustes */}
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
      </Section>

      {/* Acerca de */}
      <Section title="Aplicación">
        <div className="pf-card" style={{ overflow: "hidden" }}>
          <InfoRow icon={isOnline ? Wifi : WifiOff} label="Conexión">
            {isOnline ? "En línea" : "Sin conexión"}
          </InfoRow>
          <InfoRow icon={Info} label="Versión" last>
            <span className="tabular">
              {APP_VERSION}
              {isMock ? " · datos de demostración" : ""}
            </span>
          </InfoRow>
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
