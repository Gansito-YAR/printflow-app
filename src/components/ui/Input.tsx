// Input — label fuera del campo, placeholder dentro.
// Constitution Principle IV: sin color.

import { useState } from "react";

interface InputProps {
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  autoComplete?: string;
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
  "data-testid": testId = "input",
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && showPassword ? "text" : type;

  return (
    <div style={{ width: "100%" }}>
      <label
        style={{
          display: "block",
          fontSize: "14px",
          color: "var(--ink-muted)",
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative", width: "100%" }}>
        <input
          type={effectiveType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          data-testid={testId}
          style={{
            width: "100%",
            height: "56px",
            minHeight: "var(--hitbox-min)",
            padding: "0 16px",
            fontSize: "16px",
            fontFamily: "inherit",
            color: "var(--ink-strong)",
            backgroundColor: "var(--surface-0)",
            border: error ? "2px solid var(--border-strong)" : "1px solid var(--border-hairline)",
            borderRadius: "0",
            outline: "none",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.5 : 1,
            paddingRight: isPassword ? "56px" : "16px",
          }}
        />
        {isPassword && (
          <button
            type="button"
            data-testid={`${testId}-show`}
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              height: "48px",
              minWidth: "48px",
              padding: "0 8px",
              background: "none",
              border: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              color: "var(--ink-muted)",
              fontSize: "12px",
            }}
          >
            [{showPassword ? "OCULTAR" : "MOSTRAR"}]
          </button>
        )}
      </div>
    </div>
  );
}
