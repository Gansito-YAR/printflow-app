// MyRouteScreen — FR-004: sin dinero. Constitution Principle III.
// Semáforo estructural sin color.
// Fase 1.5: DATOS INCOMPLETOS agrupados al final, botón actualizar siempre visible, fecha del día.

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw, WifiOff } from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { gateway } from "../../data";
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
  const text = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
  return text.charAt(0).toUpperCase() + text.slice(1); // "Jueves, 8 de octubre de 2026"
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

  const MONTHS_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

  const emptyBlock = (testId: string, Icon: typeof Inbox, title: string, detail: string, action?: ReactNode) => (
    <div
      data-testid={testId}
      className="pf-card pf-enter"
      style={{ padding: "32px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-full)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--surface-2)",
          color: "var(--ink-base)",
        }}
      >
        <Icon size={26} />
      </span>
      <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--ink-strong)" }}>{title}</p>
      <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>{detail}</p>
      {action && <div style={{ width: "100%", marginTop: "8px" }}>{action}</div>}
    </div>
  );

  return (
    <div data-testid="route-screen" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Título + fecha del día */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "var(--ink-strong)" }}>Mi Ruta</h1>
        <p data-testid="route-date" style={{ fontSize: "14px", color: "var(--ink-muted)", margin: "2px 0 0" }}>
          {formatToday()}
        </p>
      </div>

      {/* Control segmentado Hoy / Próximas + actualizar */}
      <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
        <div
          role="tablist"
          aria-label="Filtrar ruta"
          style={{
            flex: 1,
            display: "flex",
            padding: "4px",
            gap: "4px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--surface-2)",
          }}
        >
          {(["today", "upcoming"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={active}
                data-testid={`filter-${f}`}
                onClick={() => setFilter(f)}
                className="pf-pressable"
                style={{
                  flex: 1,
                  minHeight: "44px",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: active ? "var(--surface-card)" : "transparent",
                  boxShadow: active ? "var(--shadow-1)" : "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--ink-strong)" : "var(--ink-muted)",
                  fontFamily: "inherit",
                }}
              >
                {f === "today" ? "Hoy" : "Próximas"}
              </button>
            );
          })}
        </div>
        <button
          data-testid="button-refresh"
          aria-label="Actualizar ruta"
          onClick={handleRefresh}
          disabled={!isOnline || refreshing}
          className="pf-pressable"
          style={{
            width: "52px",
            minWidth: "52px",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--surface-card)",
            cursor: !isOnline || refreshing ? "not-allowed" : "pointer",
            color: "var(--ink-strong)",
            opacity: !isOnline || refreshing ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {refreshing ? <Spinner size="sm" /> : <RefreshCw size={20} aria-hidden="true" />}
        </button>
      </div>

      {state === "loading" && (
        <div data-testid="route-loading" aria-busy="true" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="pf-card skeleton-pulse" style={{ height: "84px" }} />
          ))}
        </div>
      )}
      {state === "empty" &&
        emptyBlock(
          "route-empty",
          Inbox,
          "Sin entregas pendientes",
          "[EMPTY] No hay instalaciones listas para entrega",
        )}
      {state === "offline" &&
        emptyBlock("route-offline", WifiOff, "Sin conexión", "Sin conexión. La ruta no puede actualizarse")}
      {state === "error" &&
        emptyBlock(
          "route-error",
          AlertTriangle,
          "No pudimos cargar Mi Ruta",
          "[!] No pudimos cargar Mi Ruta. Revise su conexión.",
          <Button variant="secondary" fullWidth onClick={() => loadRoute()} data-testid="button-retry" icon={<RefreshCw size={18} aria-hidden="true" />}>
            Reintentar
          </Button>,
        )}
      {state === "success" && (
        <>
          {/* Pedidos con fecha */}
          {itemsWithDate.length > 0 && (
            <ul data-testid="route-list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {itemsWithDate.map((item, i) => {
                const status = getRouteStatus(item.promisedDate);
                const label = getRouteLabel(status);
                const date = item.promisedDate ? new Date(item.promisedDate) : null;
                const critical = status === "overdue" || status === "due-today";
                return (
                  <li
                    key={item.routeItemToken}
                    data-testid="route-card"
                    className="pf-card pf-enter"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px",
                      animationDelay: `${Math.min(i, 6) * 40}ms`,
                      borderLeft: critical ? "4px solid var(--state-blocked-border)" : "1px solid var(--border-hairline)",
                    }}
                  >
                    {/* Bloque de fecha */}
                    <div
                      aria-hidden="true"
                      className="tabular"
                      style={{
                        width: "52px",
                        minWidth: "52px",
                        height: "56px",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: critical ? "var(--state-blocked-bg)" : "var(--surface-2)",
                        color: critical ? "var(--state-blocked-ink)" : "var(--ink-strong)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1.05,
                      }}
                    >
                      <span style={{ fontSize: "20px", fontWeight: 800 }}>{date ? date.getDate() : "—"}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em" }}>
                        {date ? MONTHS_SHORT[date.getMonth()] : ""}
                      </span>
                    </div>
                    <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--ink-strong)", overflowWrap: "anywhere" }}>
                        {item.productLabel}
                      </p>
                      <p className="tabular" style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
                        {date ? date.toLocaleDateString("es-MX") : "—"}
                        {date && ` · ${date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                      <span>
                        <StatusBadge variant={status === "error" ? "error" : status} label={label} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pedidos sin fecha — DATOS INCOMPLETOS */}
          {itemsWithoutDate.length > 0 && (
            <div data-testid="route-incomplete" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h2
                data-testid="incomplete-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink-muted)",
                  margin: "8px 0 0",
                }}
              >
                <AlertTriangle size={14} aria-hidden="true" />
                DATOS INCOMPLETOS
              </h2>
              {itemsWithoutDate.map((item) => (
                <div
                  key={item.routeItemToken}
                  data-testid="route-card-incomplete"
                  className="pf-card"
                  style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px", borderStyle: "dashed" }}
                >
                  <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--ink-strong)" }}>{item.productLabel}</p>
                  <span>
                    <StatusBadge variant="error" label="SIN FECHA PACTADA" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
