// StatusHero — encabezado de estado de un resultado (rediseño 1.2.0).
// Icono grande en círculo + etiqueta corta + título + descripción.
// La criticidad se comunica por icono y texto; el color es refuerzo.

import type { LucideIcon } from "lucide-react";

export type HeroTone = "cleared" | "blocked" | "warning" | "neutral";

interface StatusHeroProps {
  tone: HeroTone;
  icon: LucideIcon;
  /** Etiqueta corta en mayúsculas (p. ej. "ENTREGA BLOQUEADA"). */
  kicker: string;
  title?: string;
  description?: string;
  "data-testid"?: string;
  titleTestId?: string;
  descriptionTestId?: string;
}

export function StatusHero({
  tone,
  icon: Icon,
  kicker,
  title,
  description,
  "data-testid": testId,
  titleTestId,
  descriptionTestId,
}: StatusHeroProps) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px" }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "var(--radius-full)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `var(--state-${tone}-bg)`,
          color: `var(--state-${tone}-ink)`,
          border: `2px solid var(--state-${tone}-border)`,
        }}
      >
        <Icon size={36} strokeWidth={2.25} />
      </span>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: `var(--state-${tone}-ink)`,
        }}
      >
        {kicker}
      </span>
      {title && (
        <h1 data-testid={titleTestId} style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.25, color: "var(--ink-strong)", margin: 0 }}>
          {title}
        </h1>
      )}
      {description && (
        <p data-testid={descriptionTestId} style={{ fontSize: "15px", color: "var(--ink-base)", lineHeight: 1.5, margin: 0, maxWidth: "34ch" }}>
          {description}
        </p>
      )}
    </div>
  );
}
