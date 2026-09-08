// MyRouteScreen — FR-004: sin dinero. Constitution Principle III.
// Semáforo estructural sin color.
// Fase 1.5: DATOS INCOMPLETOS agrupados al final, botón actualizar siempre visible, fecha del día.

import { useState, useEffect, useCallback } from "react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { gateway } from "../../data/mocks/mockGateway";
import { useSessionStore } from "../../store/session";
import type { RouteItemDTO } from "../../data/contracts";

type RouteState = "loading" | "success" | "empty" | "offline" | "error";

function getRouteStatus(promisedDate: string | null): "overdue" | "due-today" | "due-tomorrow" | "on-time" | "error" {
  if (!promisedDate) return "error";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);
  const startOfDayAfter = new Date(startOfTomorrow.getTime() + 86400000);
  const date = new Date(promisedDate);

  if (date < startOfToday) return "overdue";
  if (date >= startOfToday && date < startOfTomorrow) return "due-today";
  if (date >= startOfTomorrow && date < startOfDayAfter) return "due-tomorrow";
  return "on-time";
}

function getRouteLabel(status: ReturnType<typeof getRouteStatus>): string {
  switch (status) {
    case "overdue": return "VENCIDO";
    case "due-today": return "VENCE HOY";
    case "due-tomorrow": return "VENCE MAÑANA";
    case "on-time": return "EN TIEMPO";
    case "error": return "SIN FECHA PACTADA";
  }
}

function formatToday(): string {
  const now = new Date();
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

export function MyRouteScreen() {
  const isOnline = useSessionStore((s) => s.getEffectiveOnline());
  const [filter, setFilter] = useState<"today" | "upcoming">("today");
  const [state, setState] = useState<RouteState>("loading");
  const [items, setItems] = useState<RouteItemDTO[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoute = useCallback(async () => {
    if (!isOnline) {
      setState("offline");
      return;
    }
    setState("loading");
    try {
      const result = await gateway.getMyRoute(filter);
      setItems(result);
      setState(result.length === 0 ? "empty" : "success");
    } catch {
      setState("error");
    }
  }, [filter, isOnline]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  const handleRefresh = async () => {
    if (!isOnline || refreshing) return;
    setRefreshing(true);
    try {
      const result = await gateway.getMyRoute(filter);
      setItems(result);
      setState(result.length === 0 ? "empty" : "success");
    } catch {
      setState("error");
    } finally {
      setRefreshing(false);
    }
  };

  // Separar items con fecha de items sin fecha (DATOS INCOMPLETOS)
  const itemsWithDate = items.filter((item) => item.promisedDate !== null);
  const itemsWithoutDate = items.filter((item) => item.promisedDate === null);

  return (
    <div data-testid="route-screen" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header con título + fecha del día */}
      <div>
        <h1 style={{ fontSize: "18px", fontWeight: 700 }}>Mi Ruta</h1>
        <p data-testid="route-date" style={{ fontSize: "14px", color: "var(--ink-muted)", marginTop: "4px" }}>
          {formatToday()}
        </p>
      </div>

      {/* Filtros + botón actualizar */}
      <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
        {(["today", "upcoming"] as const).map((f) => (
          <button
            key={f}
            data-testid={`filter-${f}`}
            onClick={() => setFilter(f)}
            style={{
              flex: 1,
              height: "48px",
              minHeight: "var(--hitbox-min)",
              border: filter === f ? "2px solid var(--border-strong)" : "1px solid var(--border-hairline)",
              backgroundColor: filter === f ? "var(--surface-1)" : "var(--surface-0)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--ink-strong)",
            }}
          >
            {f === "today" ? "Hoy" : "Próximas"}
          </button>
        ))}
        <button
          data-testid="button-refresh"
          onClick={handleRefresh}
          disabled={!isOnline || refreshing}
          style={{
            height: "48px",
            minHeight: "var(--hitbox-min)",
            width: "48px",
            border: "1px solid var(--border-hairline)",
            backgroundColor: "var(--surface-0)",
            cursor: !isOnline || refreshing ? "not-allowed" : "pointer",
            fontSize: "14px",
            color: "var(--ink-strong)",
            opacity: !isOnline || refreshing ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {refreshing ? <Spinner size="sm" /> : "↻"}
        </button>
      </div>

      {state === "loading" && (
        <div data-testid="route-loading" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton-pulse"
              style={{ height: "80px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)" }}
            />
          ))}
        </div>
      )}
      {state === "empty" && (
        <div data-testid="route-empty" style={{ padding: "32px 16px", textAlign: "center" }}>
          <p style={{ marginBottom: "16px" }}>[EMPTY] No hay instalaciones listas para entrega</p>
        </div>
      )}
      {state === "offline" && (
        <div data-testid="route-offline" style={{ padding: "32px 16px", textAlign: "center" }}>
          <p>Sin conexión. La ruta no puede actualizarse</p>
        </div>
      )}
      {state === "error" && (
        <div data-testid="route-error" style={{ padding: "32px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ marginBottom: "16px" }}>[!] No pudimos cargar Mi Ruta</p>
          <Button variant="secondary" fullWidth onClick={() => loadRoute()} data-testid="button-retry">
            Reintentar
          </Button>
        </div>
      )}
      {state === "success" && (
        <>
          {/* Items con fecha */}
          {itemsWithDate.length > 0 && (
            <div data-testid="route-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {itemsWithDate.map((item) => {
                const status = getRouteStatus(item.promisedDate);
                const label = getRouteLabel(status);
                return (
                  <div
                    key={item.routeItemToken}
                    data-testid="route-card"
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--surface-0)",
                      border: status === "overdue" || status === "due-today"
                        ? "4px solid var(--border-strong)"
                        : status === "due-tomorrow"
                        ? "2px dashed var(--border-strong)"
                        : "1px solid var(--border-hairline)",
                    }}
                  >
                    <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                      {item.productLabel}
                    </p>
                    <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "8px" }}>
                      {item.promisedDate ? new Date(item.promisedDate).toLocaleDateString("es-MX") : "—"}
                    </p>
                    <StatusBadge variant={status === "error" ? "error" : status} label={label} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Items sin fecha — DATOS INCOMPLETOS */}
          {itemsWithoutDate.length > 0 && (
            <div data-testid="route-incomplete" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h2
                data-testid="incomplete-header"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--ink-muted)",
                  borderTop: "2px solid var(--border-strong)",
                  paddingTop: "16px",
                }}
              >
                DATOS INCOMPLETOS
              </h2>
              {itemsWithoutDate.map((item) => (
                <div
                  key={item.routeItemToken}
                  data-testid="route-card-incomplete"
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--surface-0)",
                    border: "2px solid var(--border-strong)",
                  }}
                >
                  <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                    {item.productLabel}
                  </p>
                  <StatusBadge variant="error" label="SIN FECHA PACTADA" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
