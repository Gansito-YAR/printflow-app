// Button — variantes + estados Disabled/Loading/Error.
// Constitution Principle IV: sin color, solo grises.

import type { ReactNode } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "secondary";
  "data-testid"?: string;
  type?: "button" | "submit";
}

export function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  error = false,
  fullWidth = false,
  variant = "primary",
  "data-testid": testId = "button",
  type = "button",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = {
    height: "56px",
    minHeight: "var(--hitbox-min)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "0 16px",
    fontSize: "16px",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: isDisabled ? "not-allowed" : "pointer",
    width: fullWidth ? "100%" : "auto",
    transition: "opacity 0.15s",
    opacity: isDisabled ? 0.5 : 1,
  };

  const variantStyle: React.CSSProperties =
    variant === "primary"
      ? {
          backgroundColor: "var(--ink-strong)",
          color: "var(--surface-0)",
          border: "2px solid var(--ink-strong)",
        }
      : {
          backgroundColor: "transparent",
          color: "var(--ink-strong)",
          border: "2px solid var(--ink-strong)",
        };

  const errorStyle: React.CSSProperties = error
    ? { border: "2px solid var(--border-strong)" }
    : {};

  return (
    <button
      type={type}
      data-testid={testId}
      onClick={onClick}
      disabled={isDisabled}
      style={{ ...baseStyle, ...variantStyle, ...errorStyle }}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
