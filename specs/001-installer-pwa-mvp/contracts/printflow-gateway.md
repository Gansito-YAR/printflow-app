# Contract: PrintflowGateway

**Date**: 2026-08-12
**Status**: Complete
**Authority**: Definido por Isaías (Líder Técnico). No se modifica sin su aprobación.

## Descripción

`PrintflowGateway` es la interfaz única entre la PWA móvil y el backend. En Fase 1 está implementada con mocks (`mockGateway.ts`). Cuando la API real esté lista (Fase 2), **solo se cambia la implementación del gateway** — ninguna pantalla se toca.

## Interfaz

```typescript
export interface PrintflowGateway {
  signIn(email: string, password: string): Promise<SessionDTO>;
  scanOrder(payload: string): Promise<ScanOutcome>;
  confirmDelivery(orderToken: string): Promise<
    { ok: true; deliveredAt: string } | { ok: false; reason: string }
  >;
  getMyRoute(filter: 'today' | 'upcoming'): Promise<RouteItemDTO[]>;
}
```

## Métodos

### `signIn(email, password)`

**Input**:
- `email: string` — correo del instalador
- `password: string` — contraseña

**Output**: `Promise<SessionDTO>`
- Sesión con `role: 'INSTALLER'`, `sessionStartedAt` = ahora, `absoluteDeadline` = ahora + 12h

**Errores**:
- Credenciales inválidas → throw `Error('Credenciales inválidas')`
- Sin conexión → throw `Error('NETWORK_ERROR')`

**Mock**: Acepta `instalador@imprenta.com` / `demo1234`. Latencia 500-800ms.

---

### `scanOrder(payload)`

**Input**:
- `payload: string` — contenido del QR escaneado (token opaco)

**Output**: `Promise<ScanOutcome>`
- `FOUND` → pedido encontrado con `ScannedOrderDTO`
- `NOT_FOUND` → QR válido pero no corresponde a un pedido
- `NETWORK_ERROR` → sin conexión
- `INVALID_PAYLOAD` → QR dañado o no válido

**Mock**: Mapea `payload` a uno de los 7 fixtures. Si no coincide ninguno, devuelve `NOT_FOUND`. Latencia 500-800ms.

---

### `confirmDelivery(orderToken)`

**Input**:
- `orderToken: string` — token opaco del pedido a confirmar

**Output**: `Promise<{ ok: true; deliveredAt: string } | { ok: false; reason: string }>`
- `ok: true` → entrega registrada, `deliveredAt` = timestamp ISO 8601
- `ok: false` → error, `reason` = causa genérica (no técnica)

**Casos especiales**:
- Si otra sesión ya entregó → `{ ok: false, reason: 'La entrega ya había sido registrada' }`
- Si el saldo cambió → `{ ok: false, reason: 'El saldo del pedido ha cambiado' }`
- Sin conexión → throw `Error('NETWORK_ERROR')`

**Mock**: Siempre devuelve `ok: true` con `deliveredAt` = ahora. Latencia 500-800ms. Panel de desarrollo puede forzar error.

---

### `getMyRoute(filter)`

**Input**:
- `filter: 'today' | 'upcoming'` — entregas de hoy o próximas

**Output**: `Promise<RouteItemDTO[]>`
- Lista de items de ruta ordenados por `promisedDate` ascendente
- Array vacío si no hay entregas

**⚠️ PROHIBIDO**: El resultado NO contiene campos de dinero. `RouteItemDTO` solo tiene `routeItemToken`, `productLabel`, `promisedDate`.

**Mock**: Devuelve 5-8 items sintéticos con fechas variadas (hoy, mañana, vencido, futuro, fecha nula). Latencia 500-800ms.

## Reglas del contrato

1. **El dinero viaja como `Money` (string)**. Nunca como `number`.
2. **`balanceDue: null` es indeterminado**, no cero. Nunca se interpreta como liquidado.
3. **`orderToken` y `routeItemToken` son opacos**. La app no los parsea, no los decodifica, no asume formato.
4. **La app no calcula el saldo**. Lo lee del gateway. La autoridad es la base de datos (cuando exista).
5. **`getMyRoute` no expone dinero**. Es política de confidencialidad.
6. **Los tipos de `contracts.ts` no se modifican sin aprobación de Isaías**.

## Migración a API real (Fase 2)

Cuando la API esté lista, se crea `apiGateway.ts` que implementa la misma interfaz `PrintflowGateway` pero con `fetch` a Supabase/RPC. El cambio se hace en un solo lugar:

```typescript
// Antes (Fase 1)
export const gateway: PrintflowGateway = new MockGateway();

// Después (Fase 2)
export const gateway: PrintflowGateway = new ApiGateway();
```

Ninguna pantalla, ningún componente, ningún store se modifica.
