// InfoRow — fila de detalle dentro de una tarjeta (rediseño 1.2.0).
// Icono + etiqueta pequeña + valor. Las filas se separan con una línea fina.

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  /** Valor destacado (p. ej. saldo): más grande y con cifras tabulares. */
  emphasis?: boolean;
  last?: boolean;
  "data-testid"?: string;
}

export function InfoRow({ icon: Icon, label, children, emphasis = false, last = false, "data-testid": testId }: InfoRowProps) {
  return (
    <div
      data-testid={testId}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderBottom: last ? "none" : "1px solid var(--border-hairline)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "36px",
          height: "36px",
          flexShrink: 0,
          borderRadius: "10px",
          backgroundColor: "var(--surface-2)",
          color: "var(--ink-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>{label}</p>
        <div
          className={emphasis ? "tabular" : undefined}
          style={{
            fontSize: emphasis ? "24px" : "16px",
            fontWeight: emphasis ? 800 : 600,
            color: "var(--ink-strong)",
            marginTop: "2px",
            overflowWrap: "anywhere",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
