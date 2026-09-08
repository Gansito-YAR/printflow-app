// LoginScreen — FR-013 a FR-015, FR-027.
// Constitution Principle V: login contra mocks.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { gateway } from "../../data/mocks/mockGateway";
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
  const [submitted, setSubmitted] = useState(false);

  const isEmailValid = EMAIL_REGEX.test(email);
  const isPasswordValid = password.length > 0;
  const isFormValid = isEmailValid && isPasswordValid;
  const isButtonDisabled = !isFormValid || loading || !isOnline;

  const handleSubmit = async () => {
    if (isButtonDisabled) return;
    setLoading(true);
    setError(false);
    setSubmitted(true);
    try {
      const session = await gateway.signIn(email, password);
      login(session);
      navigate("/escanear");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "NETWORK_ERROR") {
        // offline — el botón ya está deshabilitado por isOnline
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
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header
        data-testid="app-header"
        style={{
          height: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
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
      </header>
      <main
        style={{
          flex: 1,
          padding: "96px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "400px",
          margin: "0 auto",
          width: "100%",
        }}
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
          data-testid="input-password"
        />
        {error && (
          <p
            role="alert"
            data-testid="login-error"
            style={{
              color: "var(--ink-strong)",
              fontSize: "14px",
              padding: "8px",
              border: "2px solid var(--border-strong)",
            }}
          >
            Credenciales inválidas
          </p>
        )}
        {!isOnline && (
          <p
            data-testid="offline-login-message"
            style={{
              color: "var(--ink-muted)",
              fontSize: "14px",
            }}
          >
            Se requiere conexión para iniciar sesión
          </p>
        )}
        <Button
          fullWidth
          disabled={isButtonDisabled}
          loading={loading}
          onClick={handleSubmit}
          data-testid="button-login"
        >
          {loading ? "Iniciando sesión…" : "Iniciar sesión"}
        </Button>
        <p
          style={{
            fontSize: "12px",
            color: "var(--ink-muted)",
            textAlign: "center",
          }}
        >
          La sesión caduca 12 horas después de iniciar sesión
        </p>
        {/* Credenciales demo visibles siempre — Fase 1.5 */}
        <div
          data-testid="demo-credentials"
          style={{
            marginTop: "24px",
            padding: "16px",
            border: "1px solid var(--border-hairline)",
            fontSize: "12px",
            color: "var(--ink-muted)",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>
            [MODO DEMO]
          </p>
          <p>Correo: {MOCK_CREDENTIALS.email}</p>
          <p>Contraseña: {MOCK_CREDENTIALS.password}</p>
        </div>
        <Link
          to="/demo"
          data-testid="button-demo-login"
          style={{
            display: "block",
            textAlign: "center",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--ink-muted)",
            textDecoration: "none",
            padding: "8px",
            border: "1px solid var(--border-hairline)",
            marginTop: "8px",
          }}
        >
          [DEMO] Ir al panel de demostración
        </Link>
      </main>
    </div>
  );
}
