// LoginScreen — FR-013 a FR-015, FR-027.
// Rediseño 1.2.0: bienvenida con marca, formulario en tarjeta con iconos,
// envío con Enter (form), errores con icono y texto, selector de tema visible.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import { AlertCircle, Clock, FlaskConical, Lock, LogIn, Mail, WifiOff } from "lucide-react";
import { gateway, isMock } from "../../data";
import { MOCK_CREDENTIALS } from "../../data/mocks/fixtures";
import { useSessionStore } from "../../store/session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const navigate = useNavigate();
  const login = useSessionStore((s) => s.login);
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [serverUnreachable, setServerUnreachable] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEmailValid = EMAIL_REGEX.test(email);
  const isPasswordValid = password.length > 0;
  const isFormValid = isEmailValid && isPasswordValid;
  const isButtonDisabled = !isFormValid || loading || !isOnline;

  const handleSubmit = async () => {
    if (isButtonDisabled) return;
    setLoading(true);
    setError(false);
    setServerUnreachable(false);
    setSubmitted(true);
    try {
      const session = await gateway.signIn(email, password);
      login(session);
      navigate("/escanear");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "NETWORK_ERROR") {
        // Con red, pero sin llegar al servidor (URL mal escrita, servidor caído).
        setServerUnreachable(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="login-screen"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--surface-page)" }}
    >
      <header
        data-testid="app-header"
        style={{
          height: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px 0 16px",
        }}
      >
        <img
          src="/brand/logo-mark.png"
          alt="Imprenta Escalante"
          data-testid="logo-placeholder"
          width={32}
          height={32}
          style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "8px" }}
        />
        <ThemeToggle />
      </header>
      <main
        style={{
          flex: 1,
          padding: "24px 16px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "420px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Marca y bienvenida */}
        <div className="pf-enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
          <img
            src="/brand/logo-mark.png"
            alt=""
            width={88}
            height={75}
            style={{ width: "88px", height: "75px", objectFit: "cover", borderRadius: "20px", boxShadow: "var(--shadow-card)" }}
          />
          <p style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", color: "var(--brand-ink-accent)", textTransform: "uppercase", margin: 0 }}>
            PrintFlow · Entregas
          </p>
          <h1 style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1.2, margin: 0, color: "var(--ink-strong)" }}>
            Bienvenido
          </h1>
          <p style={{ fontSize: "15px", color: "var(--ink-base)", margin: 0, lineHeight: 1.5 }}>
            Inicie sesión para validar y registrar entregas.
          </p>
        </div>

        <form
          className="pf-card pf-enter"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          noValidate
          style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="instalador@imprenta.com"
            disabled={loading}
            error={error}
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            icon={<Mail size={20} />}
            data-testid="input-email"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            disabled={loading}
            error={error}
            autoComplete="current-password"
            icon={<Lock size={20} />}
            data-testid="input-password"
          />
          {error && (
            <p
              role="alert"
              data-testid="login-error"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                margin: 0,
                color: "var(--state-blocked-ink)",
                fontSize: "14px",
                fontWeight: 600,
                padding: "12px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--state-blocked-border)",
                backgroundColor: "var(--state-blocked-bg)",
              }}
            >
              <AlertCircle size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }} />
              Credenciales inválidas
            </p>
          )}
          {serverUnreachable && (
            <p role="alert" data-testid="login-unreachable" style={{ margin: 0, color: "var(--state-warning-ink)", fontSize: "14px", fontWeight: 600 }}>
              No se pudo contactar al servidor. Intente de nuevo; si persiste, avise a Sistemas.
            </p>
          )}
          {!isOnline && (
            <p
              data-testid="offline-login-message"
              style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, color: "var(--state-warning-ink)", fontSize: "14px", fontWeight: 600 }}
            >
              <WifiOff size={16} aria-hidden="true" />
              Se requiere conexión para iniciar sesión
            </p>
          )}
          <Button
            fullWidth
            type="submit"
            disabled={isButtonDisabled}
            loading={loading}
            data-testid="button-login"
            icon={<LogIn size={20} aria-hidden="true" />}
          >
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>
        </form>

        <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "var(--ink-muted)", textAlign: "center", margin: 0 }}>
          <Clock size={14} aria-hidden="true" />
          La sesión caduca 12 horas después de iniciar sesión
        </p>

        {/* Credenciales demo — solo con datos simulados (Fase 1.5, APP-D-02) */}
        {isMock && (
          <div
            data-testid="demo-credentials"
            style={{
              padding: "16px",
              borderRadius: "var(--radius-xl)",
              border: "1px dashed var(--brand-bg)",
              backgroundColor: "var(--brand-soft-bg)",
              fontSize: "13px",
              color: "var(--ink-base)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <p style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, letterSpacing: "0.06em", color: "var(--brand-ink-accent)", margin: "0 0 4px" }}>
              <FlaskConical size={14} aria-hidden="true" />
              [MODO DEMO]
            </p>
            <p style={{ margin: 0 }}>Correo: {MOCK_CREDENTIALS.email}</p>
            <p style={{ margin: 0 }}>Contraseña: {MOCK_CREDENTIALS.password}</p>
            <Link
              to="/demo"
              data-testid="button-demo-login"
              className="pf-pressable"
              style={{
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                minHeight: "44px",
                borderRadius: "var(--radius-lg)",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--brand-ink-accent)",
                textDecoration: "none",
                border: "1px solid var(--brand-bg)",
              }}
            >
              [DEMO] Ir al panel de demostración
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
