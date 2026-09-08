// Spinner monocromático. Constitution Principle IV: sin color.

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  "data-testid"?: string;
}

const SIZE_MAP = {
  sm: "16px",
  md: "24px",
  lg: "32px",
} as const;

export function Spinner({ size = "md", "data-testid": testId = "spinner" }: SpinnerProps) {
  const px = SIZE_MAP[size];
  return (
    <span
      data-testid={testId}
      className="spinner-ring inline-block rounded-full"
      style={{
        width: px,
        height: px,
        border: `2px solid var(--surface-3)`,
        borderTopColor: "var(--ink-strong)",
      }}
      role="status"
      aria-label="Cargando"
    />
  );
}
