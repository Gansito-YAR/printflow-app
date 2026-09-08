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

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  blocked: {
    border: "4px solid var(--border-strong)",
    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, var(--surface-3) 4px, var(--surface-3) 8px)",
  },
  overdue: {
    border: "4px solid var(--border-strong)",
    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, var(--surface-3) 4px, var(--surface-3) 8px)",
  },
  "due-today": {
    border: "4px solid var(--border-strong)",
  },
  "due-tomorrow": {
    border: "2px dashed var(--border-strong)",
  },
  "on-time": {
    border: "1px solid var(--border-hairline)",
  },
  authorized: {
    border: "4px double var(--border-strong)",
  },
  error: {
    border: "2px solid var(--border-strong)",
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
