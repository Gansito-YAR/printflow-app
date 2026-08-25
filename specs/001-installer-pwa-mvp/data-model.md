# Data Model: PWA Móvil del Instalador — Fase 1

**Date**: 2026-08-12
**Status**: Complete

## Entities

### Money (Type Alias)

**Tipo**: `type Money = string`

**Descripción**: Dinero como string decimal de 2 posiciones. Nunca como `number`.

**Validación**:
- Debe matchear regex `/^\d+\.\d{2}$/` (ej: `"0.00"`, `"1250.50"`)
- `"0.00"` es el único valor que representa "liquidado"
- Valores negativos (`"-100.00"`) representan anomalías/inconsistencias
- `null` representa saldo indeterminado (no cero, no liquidado)

**Regla dura**: Prohibido comparar con tolerancias de punto flotante. Prohibido convertir a `number` para comparar. Comparación exacta de strings.

---

### OrderStatus (Enum)

**Tipo**: `'PENDING_DEPOSIT' | 'IN_PRODUCTION' | 'READY_FOR_DELIVERY' | 'DELIVERED'`

**Descripción**: Estado del pedido en el pipeline de producción.

**State Transitions**:
```
PENDING_DEPOSIT → IN_PRODUCTION → READY_FOR_DELIVERY → DELIVERED
```

**Notas**:
- Solo `READY_FOR_DELIVERY` es entregable
- `DELIVERED` significa que ya fue entregado (no se puede entregar de nuevo)
- `PENDING_DEPOSIT` e `IN_PRODUCTION` no son entregables

---

### GuardDecision (Enum)

**Tipo**: `'ALLOW' | 'DENY_DEBT' | 'DENY_INDETERMINATE' | 'DENY_NOT_DELIVERABLE'`

**Descripción**: Resultado de `evaluateDeliveryGuard`. Determina qué panel se renderiza.

**Reglas de decisión**:
- `ALLOW`: Sesión INSTALLER válida + online + lectura viva + `READY_FOR_DELIVERY` + `balanceDue === "0.00"` exacto
- `DENY_DEBT`: `balanceDue` > 0 (deuda confirmada)
- `DENY_INDETERMINATE`: `balanceDue` es `null`, negativo, o error de parseo
- `DENY_NOT_DELIVERABLE`: `status` no es `READY_FOR_DELIVERY`

**Valor por defecto**: Cualquier caso no cubierto es `DENY_INDETERMINATE`.

**Parámetros de entrada de `evaluateDeliveryGuard`**:
- `session: SessionDTO | null` — sesión actual del instalador
- `isOnline: boolean` — estado de conexión
- `order: ScannedOrderDTO` — pedido escaneado
- `readAt: string` (ISO 8601) — timestamp del momento del escaneo. Determina si la lectura es "viva" o stale. Si `now - readAt > 60s`, la lectura se considera stale y el guard devuelve `DENY_INDETERMINATE`.
- `now: string` (ISO 8601) — timestamp actual para evaluar expiración de sesión y frescura de lectura

**Regla de frescura**: Una lectura es "viva" si `now - readAt <= 60 segundos`. Si es stale, el guard devuelve `DENY_INDETERMINATE` sin importar el saldo. Esto previene que el instalador confirme una entrega con un saldo leído hace varios minutos que ya podría haber cambiado.

---

### ScanOutcome (Discriminated Union)

**Tipo**:
```typescript
type ScanOutcome =
  | { kind: 'FOUND'; order: ScannedOrderDTO }
  | { kind: 'NOT_FOUND' }
  | { kind: 'NETWORK_ERROR' }
  | { kind: 'INVALID_PAYLOAD' }
```

**Descripción**: Resultado de escanear un QR. Determina el flujo de navegación.

**Variantes**:
- `FOUND`: QR válido, pedido encontrado. Se navega a `DeliveryResultScreen`.
- `NOT_FOUND`: QR válido pero no corresponde a un pedido. Se muestra "Código QR no reconocido".
- `NETWORK_ERROR`: Sin conexión. Se muestra overlay offline.
- `INVALID_PAYLOAD`: QR dañado o no es un QR del sistema. Se muestra "Código QR no reconocido".

---

### SessionDTO

**Atributos**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userToken` | `string` | Token opaco de sesión. Nunca el id real del usuario. |
| `fullName` | `string` | Nombre completo del instalador. |
| `role` | `'INSTALLER' \| 'ADMIN'` | Rol. En esta fase siempre `INSTALLER`. |
| `sessionStartedAt` | `string` (ISO 8601) | Timestamp de inicio de sesión. |
| `absoluteDeadline` | `string` (ISO 8601) | `sessionStartedAt + 12 horas`. No renovable. |

**Validación**:
- `absoluteDeadline` = `sessionStartedAt + 12h` exacto
- Sesión expira cuando `now > absoluteDeadline`
- No existe renovación ni extensión

**Ciclo de vida**:
1. Creado tras login exitoso (mock)
2. Válido mientras `now < absoluteDeadline`
3. Expirado cuando `now >= absoluteDeadline` → modal bloqueante → logout → redirige a login

---

### ScannedOrderDTO

**Atributos**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `orderToken` | `string` | Token opaco del pedido. Nunca el id real. |
| `customerLabel` | `string` | Label sintético del cliente. Ej: `[CLIENTE DEMO 01]` |
| `productLabel` | `string` | Label sintético del producto. Ej: `[LONA 2×3 M — DEMO]` |
| `status` | `OrderStatus` | Estado del pedido. |
| `balanceDue` | `Money \| null` | Saldo pendiente. `null` = indeterminado. **Nunca** se interpreta como cero. |

**Validación**:
- `orderToken` es opaco — no es un UUID real, no es un id secuencial
- `balanceDue === null` → `DENY_INDETERMINATE`
- `balanceDue === "-100.00"` → `DENY_INDETERMINATE` (anomalía)
- `balanceDue === "0.00"` → candidato a `ALLOW` (si demás condiciones se cumplen)
- `balanceDue === "1250.50"` → `DENY_DEBT`

**Restricción**: El instalador no ve el total del pedido, ni los abonos, ni el método de pago. Solo ve `balanceDue` en la pantalla de Bloqueo/Autorización.

---

### RouteItemDTO

**Atributos**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `routeItemToken` | `string` | Token opaco del item de ruta. |
| `productLabel` | `string` | Label sintético del producto. |
| `promisedDate` | `string` (ISO 8601) | Fecha pactada de entrega. |

**⚠️ PROHIBIDO**: Este DTO NO contiene campos de dinero. No hay `total`, `balanceDue`, `amountPaid`, `paymentMethod`. Ni siquiera se solicitan al gateway. Es política de confidencialidad (Constitution Principio III).

**Validación**:
- `promisedDate` puede ser `null` → tarjeta va a "Datos incompletos", no se inventa fecha
- Orden: `promisedDate` ascendente

---

## Fixtures Mock (7 casos de prueba)

| # | Nombre | `status` | `balanceDue` | Pantalla esperada |
|---|--------|----------|-------------|-------------------|
| F1 | Liquidado y listo | `READY_FOR_DELIVERY` | `"0.00"` | Autorización (ALLOW) |
| F2 | Con deuda | `READY_FOR_DELIVERY` | `"1250.50"` | Bloqueo (DENY_DEBT) |
| F3 | Saldo desconocido | `READY_FOR_DELIVERY` | `null` | Validación No Disponible (DENY_INDETERMINATE) |
| F4 | Sobrepago (inconsistencia) | `READY_FOR_DELIVERY` | `"-100.00"` | Validación No Disponible (DENY_INDETERMINATE) |
| F5 | Aún en producción | `IN_PRODUCTION` | `"0.00"` | Estado no entregable (DENY_NOT_DELIVERABLE) |
| F6 | Ya entregado | `DELIVERED` | `"0.00"` | Estado no entregable (DENY_NOT_DELIVERABLE) |
| F7 | QR desconocido | — | — | `NOT_FOUND` → "Código QR no reconocido" |

## Credenciales Mock

| Campo | Valor |
|-------|-------|
| Email | `instalador@imprenta.com` |
| Password | `demo1234` |
| Rol | `INSTALLER` |
| Visible en | Panel de desarrollo (`import.meta.env.DEV`) |

Cualquier otra combinación → error "Credenciales inválidas".
