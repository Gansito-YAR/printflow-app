// PlaceholderBox — caja gris con label entre corchetes.
// Constitution Principle IV: sin color, sin fotos, sin iconos reales.

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
      className={`flex items-center justify-center rounded ${trama ? "trama-diagonal" : ""}`}
      style={{
        aspectRatio,
        minHeight,
        width: "100%",
        backgroundColor: "var(--surface-2)",
        border: "1px solid var(--border-hairline)",
        color: "var(--ink-muted)",
        fontSize: "14px",
        textAlign: "center",
        padding: "16px",
      }}
    >
      [{label}]
    </div>
  );
}
