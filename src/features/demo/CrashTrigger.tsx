// CrashTrigger — componente que lanza un error durante el render.
// Fase 1.5: ErrorBoundary solo atrapa errores de render, no de event handlers.
// Este componente se monta condicionalmente cuando el interruptor crash está activo.

interface CrashTriggerProps {
  shouldCrash: boolean;
}

export function CrashTrigger({ shouldCrash }: CrashTriggerProps) {
  if (shouldCrash) {
    throw new Error("[DEMO] Error forzado por interruptor de demo");
  }
  return null;
}
