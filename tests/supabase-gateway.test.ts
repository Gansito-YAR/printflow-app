// SupabaseGateway con un cliente de Supabase simulado (sin red).
// Plan_Conexion_App_Supabase APP-05a / APP-05b.
// UUIDs de ejemplo deliberadamente "no reales" (Constitution VI).
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseGateway, isQrPayload, normalizeMoney } from "../src/data/supabase/supabaseGateway";
import { SessionRevokedError, classify } from "../src/data/supabase/errors";
import { loginTimestamp } from "../src/data/supabase/jwt";

const QR = "11111111-2222-4333-8444-555555555555";

function token(payload: object): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "none" })}.${b64(payload)}.firma`;
}
const LOGIN_EPOCH = 1_790_000_000; // marca fija
const ACCESS = token({ sub: "u1", amr: [{ method: "password", timestamp: LOGIN_EPOCH }] });

/** Construye un cliente falso con respuestas configurables. */
function fakeClient(opts: {
  signIn?: () => Promise<unknown>;
  profile?: { data: unknown; error: unknown };
  rpc?: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}) {
  const signOut = vi.fn(async () => ({ error: null }));
  const rpc = vi.fn((fn: string, args: Record<string, unknown>) => ({
    abortSignal: () => (opts.rpc ?? (async () => ({ data: null, error: null })))(fn, args),
  }));
  const client = {
    auth: {
      signInWithPassword: vi.fn(
        opts.signIn ??
          (async () => ({ data: { session: { access_token: ACCESS, user: { id: "u1" } } }, error: null })),
      ),
      signOut,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          abortSignal: () => ({
            maybeSingle: async () => opts.profile ?? { data: { role: "INSTALLER", full_name: "Instalador", is_active: true }, error: null },
          }),
        }),
      }),
    }),
    rpc,
  };
  return { client: client as unknown as SupabaseClient, rpc, signOut };
}

describe("utilidades", () => {
  it("valida el payload del QR como UUID", () => {
    expect(isQrPayload(QR)).toBe(true);
    expect(isQrPayload("HOLA-123")).toBe(false);
    expect(isQrPayload("")).toBe(false);
  });
  it("normaliza el dinero: solo string con 2 decimales", () => {
    expect(normalizeMoney("0.00")).toBe("0.00");
    expect(normalizeMoney("1250.50")).toBe("1250.50");
    expect(normalizeMoney(0)).toBeNull(); // número → indeterminado
    expect(normalizeMoney("1,250.50")).toBeNull();
    expect(normalizeMoney("12.5")).toBeNull();
    expect(normalizeMoney(null)).toBeNull();
  });
  it("lee la marca de login (amr) del JWT", () => {
    expect(loginTimestamp(ACCESS)).toBe(new Date(LOGIN_EPOCH * 1000).toISOString());
    expect(loginTimestamp(token({ sub: "u1" }))).toBeNull();
    expect(loginTimestamp("basura")).toBeNull();
  });
  it("clasifica errores sin convertir nada en autorización", () => {
    expect(classify({ message: "PF_FORBIDDEN" })).toBe("FORBIDDEN");
    expect(classify({ code: "42501", message: "permission denied" })).toBe("FORBIDDEN");
    expect(classify(new TypeError("Failed to fetch"))).toBe("NETWORK");
    expect(classify({ name: "TimeoutError", message: "Timeout" })).toBe("NETWORK");
    expect(classify({ message: "algo raro" })).toBe("UNKNOWN");
  });
});

describe("signIn", () => {
  it("INSTALLER activo: sesión con turno de 12 h desde la marca del servidor", async () => {
    const { client } = fakeClient({});
    const s = await new SupabaseGateway(() => client).signIn("a@b.c", "x");
    expect(s.role).toBe("INSTALLER");
    expect(s.sessionStartedAt).toBe(new Date(LOGIN_EPOCH * 1000).toISOString());
    expect(Date.parse(s.absoluteDeadline) - Date.parse(s.sessionStartedAt)).toBe(12 * 3600 * 1000);
  });
  it.each([
    ["ADMIN", { data: { role: "ADMIN", full_name: "Dueño", is_active: true }, error: null }],
    ["inactivo", { data: { role: "INSTALLER", full_name: "X", is_active: false }, error: null }],
    ["sin perfil", { data: null, error: null }],
  ])("%s: rechazo genérico y cierra la sesión", async (_n, profile) => {
    const { client, signOut } = fakeClient({ profile });
    await expect(new SupabaseGateway(() => client).signIn("a@b.c", "x")).rejects.toThrow("Credenciales inválidas");
    expect(signOut).toHaveBeenCalled();
  });
  it("token sin marca de login: rechazo", async () => {
    const { client } = fakeClient({
      signIn: async () => ({ data: { session: { access_token: token({ sub: "u1" }), user: { id: "u1" } } }, error: null }),
    });
    await expect(new SupabaseGateway(() => client).signIn("a@b.c", "x")).rejects.toThrow("Credenciales inválidas");
  });
  it("contraseña incorrecta: mismo mensaje genérico", async () => {
    const { client } = fakeClient({ signIn: async () => ({ data: { session: null }, error: { message: "Invalid login credentials" } }) });
    await expect(new SupabaseGateway(() => client).signIn("a@b.c", "x")).rejects.toThrow("Credenciales inválidas");
  });
  it("sin red: NETWORK_ERROR (lo que espera el login)", async () => {
    const { client } = fakeClient({ signIn: async () => { throw new TypeError("Failed to fetch"); } });
    await expect(new SupabaseGateway(() => client).signIn("a@b.c", "x")).rejects.toThrow("NETWORK_ERROR");
  });
});

describe("scanOrder", () => {
  const row = (over: object = {}) => ({
    order_token: QR, customer_label: "[CLIENTE]", product_label: "[LONA]", status: "READY_FOR_DELIVERY", balance_due: "0.00", ...over,
  });

  it("código que no es UUID: INVALID_PAYLOAD sin llamar a la red", async () => {
    const { client, rpc } = fakeClient({});
    expect(await new SupabaseGateway(() => client).scanOrder("HOLA-123")).toEqual({ kind: "INVALID_PAYLOAD" });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("0 filas: NOT_FOUND", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: [], error: null }) });
    expect(await new SupabaseGateway(() => client).scanOrder(QR)).toEqual({ kind: "NOT_FOUND" });
  });
  it("1 fila: FOUND con el saldo como texto", async () => {
    const { client, rpc } = fakeClient({ rpc: async () => ({ data: [row({ balance_due: "360.00" })], error: null }) });
    const r = await new SupabaseGateway(() => client).scanOrder(QR);
    expect(r).toEqual({ kind: "FOUND", order: { orderToken: QR, customerLabel: "[CLIENTE]", productLabel: "[LONA]", status: "READY_FOR_DELIVERY", balanceDue: "360.00" } });
    expect(rpc).toHaveBeenCalledWith("get_delivery_info", { p_qr: QR });
  });
  it("saldo numérico (formato inesperado): balanceDue null → el candado lo resuelve como indeterminado", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: [row({ balance_due: 0 })], error: null }) });
    const r = await new SupabaseGateway(() => client).scanOrder(QR);
    expect(r.kind === "FOUND" && r.order.balanceDue).toBeNull();
  });
  it("estado desconocido: no se muestra como pedido", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: [row({ status: "OTRO" })], error: null }) });
    expect((await new SupabaseGateway(() => client).scanOrder(QR)).kind).toBe("NETWORK_ERROR");
  });
  it("CANCELLED se entrega como estado válido", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: [row({ status: "CANCELLED", balance_due: "450.00" })], error: null }) });
    const r = await new SupabaseGateway(() => client).scanOrder(QR);
    expect(r.kind === "FOUND" && r.order.status).toBe("CANCELLED");
  });
  it("turno vencido o cuenta desactivada (PF_FORBIDDEN): SessionRevokedError", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: null, error: { message: "PF_FORBIDDEN" } }) });
    await expect(new SupabaseGateway(() => client).scanOrder(QR)).rejects.toBeInstanceOf(SessionRevokedError);
  });
  it("sin red: NETWORK_ERROR", async () => {
    const { client } = fakeClient({ rpc: async () => { throw new TypeError("Failed to fetch"); } });
    expect(await new SupabaseGateway(() => client).scanOrder(QR)).toEqual({ kind: "NETWORK_ERROR" });
  });
  it("error desconocido: NETWORK_ERROR (reintentar), nunca FOUND", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: null, error: { message: "boom" } }) });
    expect(await new SupabaseGateway(() => client).scanOrder(QR)).toEqual({ kind: "NETWORK_ERROR" });
  });
});

describe("confirmDelivery", () => {
  it("éxito", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: { ok: true, delivered_at: "2026-10-08T12:00:00Z" }, error: null }) });
    expect(await new SupabaseGateway(() => client).confirmDelivery(QR)).toEqual({ ok: true, deliveredAt: "2026-10-08T12:00:00Z" });
  });
  it("ya registrada", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: { ok: false, code: "ALREADY_DELIVERED", reason: "Ya." }, error: null }) });
    expect(await new SupabaseGateway(() => client).confirmDelivery(QR)).toEqual({ ok: false, code: "ALREADY_DELIVERED", reason: "Ya." });
  });
  it("respuesta con forma desconocida: UNKNOWN", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: { ok: "sí" }, error: null }) });
    expect((await new SupabaseGateway(() => client).confirmDelivery(QR)).ok).toBe(false);
  });
  it("sin red: excepción para que la UI ofrezca reintentar", async () => {
    const { client } = fakeClient({ rpc: async () => { throw new TypeError("Failed to fetch"); } });
    await expect(new SupabaseGateway(() => client).confirmDelivery(QR)).rejects.toThrow("NETWORK_ERROR");
  });
  it("PF_FORBIDDEN: SessionRevokedError", async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: null, error: { message: "PF_FORBIDDEN" } }) });
    await expect(new SupabaseGateway(() => client).confirmDelivery(QR)).rejects.toBeInstanceOf(SessionRevokedError);
  });
});

describe("getMyRoute", () => {
  it("mapea los campos y no incluye dinero", async () => {
    const { client, rpc } = fakeClient({
      rpc: async () => ({ data: [{ route_token: QR, product_label: "[LONA]", promised_date: null }], error: null }),
    });
    const r = await new SupabaseGateway(() => client).getMyRoute("today");
    expect(r).toEqual([{ routeItemToken: QR, productLabel: "[LONA]", promisedDate: null }]);
    expect(rpc).toHaveBeenCalledWith("get_my_route", { p_filter: "today" });
    expect(JSON.stringify(r)).not.toMatch(/balance|saldo|total|\$/i);
  });
});
