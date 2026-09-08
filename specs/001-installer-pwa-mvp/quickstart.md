# Quickstart: PWA Móvil del Instalador — Fase 1

**Date**: 2026-08-12
**Status**: Complete

## Prerequisites

- Node 20 LTS instalado (`node --version`)
- npm incluido con Node
- Navegador moderno (Chrome/Safari/Edge)

## Setup

```bash
# Clonar repo (si no está clonado)
git clone https://github.com/Gansito-YAR/printflow-app.git
cd printflow-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`.

## Validación de escenarios

### Escenario 1: Login exitoso

1. Abrir `http://localhost:5173` → redirige a `/login`
2. Verificar: botón "Iniciar sesión" está deshabilitado (campos vacíos)
3. Ingresar email: `instalador@imprenta.com`
4. Ingresar password: `demo1234`
5. Verificar: botón se habilita
6. Presionar "Iniciar sesión"
7. Verificar: spinner "Iniciando sesión…" visible ~500-800ms
8. Verificar: redirige a `/escanear`
9. **Expected**: Login exitoso, navegación al escáner

### Escenario 2: Login con error

1. Estar en `/login`
2. Ingresar email: `cualquier@correo.com`
3. Ingresar password: `cualquiera`
4. Presionar "Iniciar sesión"
5. **Expected**: Mensaje "Credenciales inválidas", campos conservan valores

### Escenario 3: Candado — Pedido con deuda (DENY_DEBT)

1. Hacer login (Escenario 1)
2. Estar en `/escanear`
3. Abrir panel de desarrollo (visible en modo dev)
4. Presionar fixture "Con deuda" (F2)
5. **Expected**: Pantalla de Bloqueo con borde 4px + trama diagonal
6. Inspeccionar DOM → **NO debe existir** nodo con `data-testid="delivery-confirm"`
7. Verificar: se muestra "CLIENTE DEMO 01" y "SALDO PENDIENTE: $1250.50"

### Escenario 4: Candado — Pedido liquidado (ALLOW)

1. Hacer login (Escenario 1)
2. Estar en `/escanear`
3. Abrir panel de desarrollo
4. Presionar fixture "Liquidado y listo" (F1)
5. **Expected**: Pantalla de Autorización con borde doble 4px
6. Verificar: botón "Confirmar entrega física" existe en DOM con `data-testid="delivery-confirm"`
7. Verificar: botón mide >=60x60px hitbox, 64px alto visual
8. Presionar "Confirmar entrega física"
9. **Expected**: Spinner "Confirmando entrega…" ~500-800ms
10. **Expected**: Panel estático "Entrega registrada" + timestamp + botón "Escanear otro"

### Escenario 5: Candado — Saldo indeterminado (DENY_INDETERMINATE)

1. Hacer login → `/escanear`
2. Abrir panel de desarrollo
3. Presionar fixture "Saldo desconocido" (F3)
4. **Expected**: Pantalla de Validación No Disponible
5. Inspeccionar DOM → **NO debe existir** `data-testid="delivery-confirm"`

### Escenario 6: Revalidar saldo

1. Hacer login → `/escanear`
2. Abrir panel de desarrollo
3. Presionar fixture "Con deuda" (F2)
4. Verificar: pantalla de Bloqueo con botón "Revalidar saldo"
5. Presionar "Revalidar saldo"
6. **Expected**: Spinner "Revalidando…" ~500-800ms
7. **Expected**: Pantalla se actualiza según nuevo saldo (mock puede cambiar el resultado)

### Escenario 7: Mi Ruta sin dinero

1. Hacer login → navegar a `/mi-ruta` via BottomNav
2. Verificar: lista de tarjetas con producto y fecha
3. **Expected**: NO hay signos de pesos ($) en ninguna tarjeta
4. Inspeccionar objeto `RouteItemDTO` en memoria
5. **Expected**: NO contiene campos `total`, `balanceDue`, `amountPaid`, `paymentMethod`
6. Verificar semáforo estructural:
   - Vencido/hoy → borde 4px + trama + "VENCIDO"/"VENCE HOY"
   - Mañana → borde discontinuo 2px + "VENCE MAÑANA"
   - Futuro → borde 1px + "EN TIEMPO"

### Escenario 8: Sin conexión

1. Hacer login
2. Abrir DevTools → Network → Offline
3. Navegar a `/escanear`
4. **Expected**: Overlay "Sin conexión. Muévase a un área con cobertura para validar la entrega"
5. Navegar a `/mi-ruta`
6. **Expected**: "Sin conexión. La ruta no puede actualizarse"
7. Verificar header: indica "SIN CONEXIÓN"

### Escenario 9: Sesión expirada

1. Hacer login
2. En DevTools, modificar el store de sesión para que `absoluteDeadline` sea una fecha pasada
3. **Expected**: Modal bloqueante "Sesión expirada" aparece
4. Presionar "Ir a login"
5. **Expected**: Redirige a `/login`, store de sesión limpio

## Pruebas automatizadas

```bash
# Ejecutar pruebas del candado (3 pruebas negativas obligatorias)
npm run test

# Build de producción
npm run build

# Preview del build
npm run preview
```

**Expected**: 3 pruebas pasan:
1. Con `balanceDue = "1250.50"` → `queryByTestId('delivery-confirm')` es `null`
2. Con `balanceDue = null` → `queryByTestId('delivery-confirm')` es `null`
3. Con `balanceDue = "-100.00"` → `queryByTestId('delivery-confirm')` es `null`

## Validación de layout (QA de anchos)

1. Abrir DevTools → Toggle device toolbar
2. Probar anchos: 320px, 360px, 390px, 430px (portrait)
3. En cada ancho, navegar todas las pantallas
4. **Expected**: Layout correcto en todos los anchos, sin overflow horizontal, sin elementos cortados

## Validación de escala de grises

```bash
# Buscar hex literales en componentes (debe devolver 0 resultados)
grep -rn '#[0-9a-fA-F]\{3,6\}' src/components/ src/features/ src/store/
```

**Expected**: 0 resultados. Todos los colores via `tokens.css`.

## Deploy a preview

```bash
# Build
npm run build

# Deploy a Cloudflare Pages o Vercel
# (comando específico según plataforma elegida)
```

**Expected**: URL pública accesible para revisión de Isaías. Enlace incluido en el PR.
