// PrintFlow AI — SupabaseGateway: implementación real de PrintflowGateway.
// Plan_Conexion_App_Supabase §2 Fase 2.
//
// El instalador NO lee tablas de pedidos (ARQ-02): solo llama a 3 RPC
// (get_delivery_info, confirm_delivery, get_my_route) y lee su propio perfil.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConfirmDeliveryResult,
  ConfirmFailureCode,
  OrderStatus,
  RouteItemDTO,
  ShiftSummaryDTO,
  ScanOutcome,
  SessionDTO,
} from "../contracts";
import type { PrintflowGateway } from "../gateway";
import { getSupabase } from "./client";
import { classify, SessionRevokedError, timeoutSignal } from "./errors";
import { loginTimestamp, SHIFT_MS } from "./jwt";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Dinero exacto con 2 decimales (APP-D-05). Cualquier otra forma → indeterminado. */
const MONEY_RE = /^-?\d+\.\d{2}$/;

const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING_DEPOSIT",
  "IN_PRODUCTION",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];
const CONFIRM_CODES: readonly ConfirmFailureCode[] = ["ALREADY_DELIVERED", "REJECTED_BY_RULE", "UNKNOWN"];

const GENERIC_LOGIN_ERROR = "Credenciales inválidas";

export function isQrPayload(payload: string): boolean {
  return UUID_RE.test(payload.trim());
}

export function normalizeMoney(value: unknown): string | null {
  return typeof value === "string" && MONEY_RE.test(value) ? value : null;
}

interface DeliveryInfoRow {
  order_token: string;
  customer_label: string | null;
  product_label: string | null;
  status: string;
  balance_due: unknown;
}

interface RouteRow {
  route_token: string;
  product_label: string | null;
  promised_date: string | null;
}

export class SupabaseGateway implements PrintflowGateway {
  constructor(private readonly clientFactory: () => SupabaseClient = getSupabase) {}

  private get db(): SupabaseClient {
    return this.clientFactory();
  }

  /** Errores de una RPC → excepciones con significado para la UI. */
  private raise(err: unknown): never {
    const kind = classify(err);
    if (kind === "FORBIDDEN") throw new SessionRevokedError();
    if (kind === "NETWORK") throw new Error("NETWORK_ERROR");
    throw new Error("UNKNOWN");
  }

  /** Construye la sesión a partir del token vigente. null si no es un INSTALLER activo. */
  async sessionFromToken(accessToken: string, userId: string): Promise<SessionDTO | null> {
    const startedAt = loginTimestamp(accessToken);
    if (!startedAt) return null;
    const { data, error } = await this.db
      .from("profiles")
      .select("role, full_name, is_active")
      .eq("id", userId)
      .abortSignal(timeoutSignal())
      .maybeSingle();
    if (error) this.raise(error);
    const profile = data as { role: string; full_name: string; is_active: boolean } | null;
    if (!profile || profile.role !== "INSTALLER" || !profile.is_active) return null;
    return {
      userToken: userId,
      fullName: profile.full_name,
      role: "INSTALLER",
      sessionStartedAt: startedAt,
      absoluteDeadline: new Date(new Date(startedAt).getTime() + SHIFT_MS).toISOString(),
    };
  }

  async signIn(email: string, password: string): Promise<SessionDTO> {
    let result;
    try {
      result = await this.db.auth.signInWithPassword({ email: email.trim(), password });
    } catch (err) {
      console.warn("[PrintFlow] login: la petición a Supabase Auth falló", err);
      if (classify(err) === "NETWORK") throw new Error("NETWORK_ERROR");
      throw new Error(GENERIC_LOGIN_ERROR);
    }
    const { data, error } = result;
    if (error || !data.session) {
      // Al usuario se le muestra un mensaje genérico; el motivo real queda en consola.
      console.warn("[PrintFlow] login rechazado por Supabase Auth", {
        status: (error as { status?: number } | null)?.status,
        code: (error as { code?: string } | null)?.code,
        message: error?.message ?? "sin sesión en la respuesta",
      });
      if (error && classify(error) === "NETWORK") throw new Error("NETWORK_ERROR");
      throw new Error(GENERIC_LOGIN_ERROR);
    }
    let session: SessionDTO | null = null;
    try {
      session = await this.sessionFromToken(data.session.access_token, data.session.user.id);
    } catch (err) {
      console.warn("[PrintFlow] login: no se pudo leer el perfil (profiles)", err);
      await this.db.auth.signOut();
      if (err instanceof Error && err.message === "NETWORK_ERROR") throw err;
      throw new Error(GENERIC_LOGIN_ERROR);
    }
    if (!session) {
      // ADMIN, inactivo o sin marca de login: misma respuesta genérica (no revela el motivo).
      console.warn("[PrintFlow] login: la cuenta no es un INSTALADOR activo o el token no trae la marca de login");
      await this.db.auth.signOut();
      throw new Error(GENERIC_LOGIN_ERROR);
    }
    return session;
  }

  async signOut(): Promise<void> {
    try {
      await this.db.auth.signOut();
    } catch {
      // Sin red: la sesión local se descarta igual; el token expira solo.
    }
  }

  async scanOrder(payload: string): Promise<ScanOutcome> {
    const qr = payload.trim();
    if (!isQrPayload(qr)) return { kind: "INVALID_PAYLOAD" }; // sin llamar a la red (APP-D-04)

    let result;
    try {
      result = await this.db.rpc("get_delivery_info", { p_qr: qr }).abortSignal(timeoutSignal());
    } catch (err) {
      if (classify(err) === "FORBIDDEN") throw new SessionRevokedError();
      return { kind: "NETWORK_ERROR" };
    }
    if (result.error) {
      if (classify(result.error) === "FORBIDDEN") throw new SessionRevokedError();
      return { kind: "NETWORK_ERROR" }; // el instalador reintenta; nunca autoriza
    }
    const rows = (result.data ?? []) as DeliveryInfoRow[];
    const row = rows[0];
    if (!row) return { kind: "NOT_FOUND" };
    if (!ORDER_STATUSES.includes(row.status as OrderStatus)) return { kind: "NETWORK_ERROR" };
    return {
      kind: "FOUND",
      order: {
        orderToken: row.order_token,
        customerLabel: row.customer_label ?? "",
        productLabel: row.product_label ?? "",
        status: row.status as OrderStatus,
        balanceDue: normalizeMoney(row.balance_due),
      },
    };
  }

  async confirmDelivery(orderToken: string): Promise<ConfirmDeliveryResult> {
    if (!isQrPayload(orderToken)) return { ok: false, code: "UNKNOWN", reason: "Código inválido." };
    let result;
    try {
      result = await this.db.rpc("confirm_delivery", { p_qr: orderToken }).abortSignal(timeoutSignal());
    } catch (err) {
      this.raise(err);
    }
    if (result.error) this.raise(result.error);

    const d = result.data as { ok?: unknown; delivered_at?: unknown; code?: unknown; reason?: unknown } | null;
    if (d && d.ok === true && typeof d.delivered_at === "string") {
      return { ok: true, deliveredAt: d.delivered_at };
    }
    if (d && d.ok === false && typeof d.code === "string" && CONFIRM_CODES.includes(d.code as ConfirmFailureCode)) {
      return { ok: false, code: d.code as ConfirmFailureCode, reason: typeof d.reason === "string" ? d.reason : "" };
    }
    return { ok: false, code: "UNKNOWN", reason: "Respuesta inesperada del servidor." };
  }

  async getMyRoute(filter: "today" | "upcoming"): Promise<RouteItemDTO[]> {
    let result;
    try {
      result = await this.db.rpc("get_my_route", { p_filter: filter }).abortSignal(timeoutSignal());
    } catch (err) {
      this.raise(err);
    }
    if (result.error) this.raise(result.error);
    return ((result.data ?? []) as RouteRow[]).map((r) => ({
      routeItemToken: r.route_token,
      productLabel: r.product_label ?? "",
      promisedDate: r.promised_date,
    }));
  }

  async getShiftSummary(): Promise<ShiftSummaryDTO> {
    let result;
    try {
      result = await this.db.rpc("get_my_shift_summary").abortSignal(timeoutSignal());
    } catch (err) {
      this.raise(err);
    }
    if (result.error) this.raise(result.error);
    const row = ((result.data ?? []) as { delivered_today: number; pending_today: number; overdue: number }[])[0];
    return {
      deliveredToday: row?.delivered_today ?? 0,
      pendingToday: row?.pending_today ?? 0,
      overdue: row?.overdue ?? 0,
    };
  }
}
