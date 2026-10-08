// StatusBadge — etiqueta de estado (píldora).
// Rediseño 1.2.0: icono + texto + borde. El color es refuerzo, nunca la única
// señal (se entiende en blanco y negro por el icono y la etiqueta).

import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CalendarClock,
  CalendarCheck,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from "lucide-react";

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

type Tone = "blocked" | "warning" | "neutral" | "cleared";

const VARIANTS: Record<BadgeVariant, { tone: Tone; icon: LucideIcon; dashed?: boolean }> = {
  blocked: { tone: "blocked", icon: Ban },
  overdue: { tone: "blocked", icon: AlertCircle },
  "due-today": { tone: "warning", icon: Clock },
  "due-tomorrow": { tone: "neutral", icon: CalendarClock, dashed: true },
  "on-time": { tone: "cleared", icon: CalendarCheck },
  authorized: { tone: "cleared", icon: CheckCircle2 },
  error: { tone: "blocked", icon: AlertTriangle },
};

export function StatusBadge({ variant, label, "data-testid": testId = "status-badge" }: StatusBadgeProps) {
  const { tone, icon: Icon, dashed } = VARIANTS[variant];
  return (
    <span
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px 4px 8px",
        minHeight: "28px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        lineHeight: 1.2,
        borderRadius: "var(--radius-full)",
        color: `var(--state-${tone}-ink)`,
        backgroundColor: `var(--state-${tone}-bg)`,
        border: `1px ${dashed ? "dashed" : "solid"} var(--state-${tone}-border)`,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={14} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </span>
  );
}
