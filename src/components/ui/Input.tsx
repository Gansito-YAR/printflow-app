// Input — label visible fuera del campo, placeholder dentro.
// Rediseño 1.2.0: radio, icono opcional a la izquierda, mostrar/ocultar contraseña
// con icono (y nombre accesible), foco con anillo de marca. 16 px: sin zoom en iOS.

import { useId, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps {
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  autoComplete?: string;
  /** Icono a la izquierda (decorativo). */
  icon?: ReactNode;
  /** Texto de ayuda persistente bajo el campo. */
  hint?: string;
  inputMode?: "text" | "email" | "search";
  autoCapitalize?: string;
  "data-testid"?: string;
}

export function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  autoComplete,
  icon,
  hint,
  inputMode,
  autoCapitalize,
  "data-testid": testId = "input",
}: InputProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && showPassword ? "text" : type;

  const borderColor = error
    ? "var(--state-blocked-border)"
    : focused
      ? "var(--brand-bg)"
      : "var(--border-hairline)";

  return (
    <div style={{ width: "100%" }}>
      <label
        htmlFor={id}
        style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--ink-base)", marginBottom: "8px" }}
      >
        {label}
      </label>
      <div style={{ position: "relative", width: "100%" }}>
        {icon && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-muted)",
              display: "flex",
              pointerEvents: "none",
            }}
          >
            {icon}
          </span>
        )}
        <input
          id={id}
          type={effectiveType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          aria-invalid={error || undefined}
          aria-describedby={hintId}
          data-testid={testId}
          style={{
            width: "100%",
            height: "56px",
            minHeight: "56px",
            padding: "0 16px",
            paddingLeft: icon ? "48px" : "16px",
            paddingRight: isPassword ? "56px" : "16px",
            fontSize: "16px",
            fontFamily: "inherit",
            color: "var(--ink-strong)",
            backgroundColor: "var(--surface-card)",
            border: `${error || focused ? 2 : 1.5}px solid ${borderColor}`,
            borderRadius: "14px",
            outline: "none",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.55 : 1,
            boxSizing: "border-box",
            transition: "border-color var(--duration-press) var(--ease-out)",
          }}
        />
        {isPassword && (
          <button
            type="button"
            data-testid={`${testId}-show`}
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="pf-pressable"
            style={{
              position: "absolute",
              right: "4px",
              top: "50%",
              transform: "translateY(-50%)",
              height: "48px",
              width: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              borderRadius: "12px",
              cursor: disabled ? "not-allowed" : "pointer",
              color: "var(--ink-muted)",
            }}
          >
            {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} style={{ fontSize: "13px", color: "var(--ink-muted)", marginTop: "8px", lineHeight: 1.4 }}>
          {hint}
        </p>
      )}
    </div>
  );
}
