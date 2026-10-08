// PlaceholderBox — marcador de posición (solo modo demo/mock).
// Rediseño 1.2.0: misma función, con radio y un icono discreto.

import { ScanLine } from "lucide-react";

interface PlaceholderBoxProps {
  label: string;
  aspectRatio?: string; // ej: "4/3"
  minHeight?: string;
  trama?: boolean;
  "data-testid"?: string;
}

export function PlaceholderBox({
  label,
  aspectRatio,
  minHeight = "288px",
  trama = false,
  "data-testid": testId = "placeholder-box",
}: PlaceholderBoxProps) {
  return (
    <div
      data-testid={testId}
      className={trama ? "trama-diagonal" : undefined}
      style={{
        aspectRatio,
        minHeight,
        height: minHeight === "100%" ? "100%" : undefined,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        backgroundColor: "var(--surface-2)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-2xl)",
        color: "var(--ink-muted)",
        fontSize: "13px",
        textAlign: "center",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <ScanLine size={28} aria-hidden="true" />[{label}]
    </div>
  );
}
