// StatusBadge — semáforo estructural SIN color.
// Constitution Principle IV: criticidad via bordes y tramas, no color.

type BadgeVariant =
  | "blocked"
  | "overdue"
  | "due-today"
  | "due-tomorrow"
  | "on-time"
  | "authorized"
  | "error";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  "data-testid"?: string;
}

// Fase 2: color como refuerzo. Las tramas, bordes y mayúsculas se conservan.
const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  blocked: {
    border: "4px solid var(--state-blocked-border)",
    color: "var(--state-blocked-ink)",
    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, var(--state-blocked-bg) 4px, var(--state-blocked-bg) 8px)",
  },
  overdue: {
    border: "4px solid var(--state-blocked-border)",
    color: "var(--state-blocked-ink)",
    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, var(--state-blocked-bg) 4px, var(--state-blocked-bg) 8px)",
  },
  "due-today": {
    border: "4px solid var(--state-warning-border)",
    color: "var(--state-warning-ink)",
    backgroundColor: "var(--state-warning-bg)",
  },
  "due-tomorrow": {
    border: "2px dashed var(--state-neutral-border)",
    color: "var(--state-neutral-ink)",
    backgroundColor: "var(--state-neutral-bg)",
  },
  "on-time": {
    border: "1px solid var(--state-cleared-border)",
    color: "var(--state-cleared-ink)",
    backgroundColor: "var(--state-cleared-bg)",
  },
  authorized: {
    border: "4px double var(--state-cleared-border)",
    color: "var(--state-cleared-ink)",
    backgroundColor: "var(--state-cleared-bg)",
  },
  error: {
    border: "2px solid var(--state-blocked-border)",
    color: "var(--state-blocked-ink)",
    backgroundColor: "var(--state-blocked-bg)",
  },
};

export function StatusBadge({ variant, label, "data-testid": testId = "status-badge" }: StatusBadgeProps) {
  return (
    <span
      data-testid={testId}
      style={{
        display: "inline-block",
        padding: "4px 8px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: "var(--ink-strong)",
        backgroundColor: "var(--surface-0)",
        ...VARIANT_STYLES[variant],
      }}
    >
      {label}
    </span>
  );
}
