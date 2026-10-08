// Button — variantes + estados Disabled/Loading/Error.
// Rediseño 1.2.0: radio grande, sin borde negro grueso, respuesta al presionar,
// icono opcional. Hitbox ≥ 56 px (el confirmar de entrega usa size="xl": 64 px).

import type { ReactNode } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  /** "lg" = 56 px (por defecto), "xl" = 64 px (acción crítica). */
  size?: "lg" | "xl";
  /** Icono SVG a la izquierda del texto. */
  icon?: ReactNode;
  "data-testid"?: string;
  type?: "button" | "submit";
  "aria-label"?: string;
}

export function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  error = false,
  fullWidth = false,
  variant = "primary",
  size = "lg",
  icon,
  "data-testid": testId = "button",
  type = "button",
  "aria-label": ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const height = size === "xl" ? "64px" : "56px";

  const baseStyle: React.CSSProperties = {
    height,
    minHeight: height,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "0 20px",
    fontSize: size === "xl" ? "17px" : "16px",
    fontWeight: 600,
    fontFamily: "inherit",
    letterSpacing: "0.01em",
    borderRadius: "14px",
    cursor: isDisabled ? "not-allowed" : "pointer",
    width: fullWidth ? "100%" : "auto",
  };

  const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
    primary: isDisabled
      ? {
          backgroundColor: "var(--action-disabled-bg)",
          color: "var(--action-disabled-ink)",
          border: "1px solid transparent",
        }
      : {
          backgroundColor: "var(--action-primary-bg)",
          color: "var(--action-primary-ink)",
          border: "1px solid transparent",
          boxShadow: "var(--shadow-1)",
        },
    secondary: {
      backgroundColor: "var(--surface-card)",
      color: isDisabled ? "var(--action-disabled-ink)" : "var(--ink-strong)",
      border: "1.5px solid var(--border-hairline)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: isDisabled ? "var(--action-disabled-ink)" : "var(--ink-strong)",
      border: "1px solid transparent",
    },
  };

  const errorStyle: React.CSSProperties = error ? { border: "2px solid var(--state-blocked-border)" } : {};

  return (
    <button
      type={type}
      data-testid={testId}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      className="pf-pressable"
      style={{ ...baseStyle, ...VARIANTS[variant], ...errorStyle }}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
}
