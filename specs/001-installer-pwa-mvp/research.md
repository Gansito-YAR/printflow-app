# Research: PWA Móvil del Instalador — Fase 1

**Date**: 2026-08-12
**Status**: Complete

## Research Tasks

### R1: Render condicional estricto en React (Candado de Entrega)

**Decision**: Usar `switch` sobre `GuardDecision` para montar/desmontar componentes completos. Bajo `DENY_*`, el componente `ClearancePanel` (que contiene el botón) no se instancia.

**Rationale**: React renderiza condicionalmente con `if`/`switch` + `return`. Si el componente no se monta, su JSX no existe en el DOM. Esto es fundamentalmente distinto a `display:none` o `visibility:hidden` que montan el nodo pero lo ocultan. El documento Fase 1 §9.2 es explícito: "el componente, su listener y la referencia a la mutación no forman parte del árbol renderizado".

**Alternatives considered**:
- `display:none` → ❌ Prohibido por constitution (Principio I). El nodo existe en DOM.
- `aria-hidden` → ❌ Prohibido. El nodo existe en DOM.
- `disabled` attribute → ❌ Prohibido como sustituto del candado.
- Conditional rendering con `&&` → ⚠ Funciona pero `switch` es más explícito y previene errores.

**Best practice**: Usar `switch (decision)` con casos explícitos para cada `GuardDecision`. Cada caso retorna un componente distinto. El caso `ALLOW` es el único que monta `ClearancePanel`.

### R2: Zustand store para sesión y conexión

**Decision**: Un solo store `useSessionStore` con estado de sesión (`SessionDTO | null`), estado de conexión (`boolean`), y acciones para login/logout/setOnline/setOffline.

**Rationale**: Zustand es ligero y evita prop drilling. El SRS Fase 4 lo define. La sesión y la conexión son los dos estados globales que afectan el candado (`evaluateDeliveryGuard` los consume). Mantenerlos en un solo store simplifica las pruebas.

**Alternatives considered**:
- React Context → ⚠ Funciona pero causa re-renders innecesarios en consumidores parciales.
- Redux Toolkit → ❌ Overkill para 2 estados globales.
- Stores separados (session + connection) → ⚠ Posible pero añade complejidad. La conexión afecta la sesión (offline → no login) y viceversa.

**Best practice**: Un solo store con slices para sesión y conexión. El store expone selectores para evitar re-renders: `useSessionStore(s => s.session)`, `useSessionStore(s => s.isOnline)`.

### R3: Mock Gateway con latencia simulada

**Decision**: Implementar `mockGateway.ts` que implementa `PrintflowGateway` con `setTimeout` de 500-800ms aleatorio para simular latencia. Los fixtures se definen en `fixtures.ts` como un mapa de `orderToken` → `ScannedOrderDTO`.

**Rationale**: La latencia de 500-800ms (clarificación Q2) es suficiente para que los spinners sean visibles sin hacer la revisión lenta. Usar `Math.random() * 300 + 500` da variación natural. Los fixtures se mapean por `orderToken` para que el panel de desarrollo pueda "escanear" un fixture específico.

**Alternatives considered**:
- Latencia fija exacta (500ms) → ⚠ Muy predecible, parece artificial.
- Latencia variable por operación → ❌ Complejidad innecesaria en Fase 1 (clarificación Q2 lo descartó).
- Sin latencia (0ms) → ❌ Los spinners no se ven. No se pueden probar estados de loading.

**Best practice**: `setTimeout(resolve, Math.random() * 300 + 500)` en cada método del mock. El panel de desarrollo llama directamente al gateway con un `orderToken` fixture.

### R4: Tailwind CSS con tokens de escala de grises

**Decision**: Configurar Tailwind con `theme.extend.colors` mapeando a las variables CSS de `tokens.css`. Usar `surface-0`, `surface-1`, `surface-2`, `surface-3`, `ink-strong`, `ink-base`, `ink-muted`, `border-hairline`, `border-strong` como clases de Tailwind.

**Rationale**: La constitution (Principio IV) prohíbe hex literales en componentes. Tailwind normalmente genera clases con colores hex, pero si se mapea a `var(--surface-0)` etc., los componentes usan clases semánticas (`bg-surface-0`, `text-ink-strong`) y los valores reales viven en `tokens.css`. Cuando llegue la identidad visual en Fase 2, solo se cambian las variables CSS.

**Alternatives considered**:
- CSS Modules sin Tailwind → ❌ El documento Fase 1 §4 define Tailwind. Control fino del grid de 8 puntos.
- Tailwind con config directa de hex → ❌ Viola constitution. Hex literales en config.
- Styled-components → ❌ No está en el stack definido.

**Best practice**: `tailwind.config.ts` con `theme.extend.colors = { 'surface-0': 'var(--surface-0)', ... }`. `tokens.css` define los valores. Componentes usan `bg-surface-0 text-ink-strong border-border-strong`.

### R5: PWA manifest con vite-plugin-pwa (solo manifest, sin Service Worker de caché)

**Decision**: Configurar `vite-plugin-pwa` con `registerType: 'prompt'` y solo el manifest. No configurar estrategias de Workbox (CacheFirst, NetworkOnly) — eso es Fase 2.

**Rationale**: La constitution (Principio V) prohíbe Service Worker con estrategias de caché en Fase 1. Pero el manifest sí es necesario para que la PWA sea instalable (criterio de aceptación). `registerType: 'prompt'` muestra el prompt de actualización que alimenta el `UpdateToast`.

**Alternatives considered**:
- Sin vite-plugin-pwa → ❌ No hay manifest, no es instalable.
- vite-plugin-pwa con Workbox completo → ❌ Viola constitution (Principio V).
- Manifest manual en `public/manifest.json` → ⚠ Funciona pero pierde el `registerType: 'prompt'` y el UpdateToast.

**Best practice**: `VitePWA({ registerType: 'prompt', manifest: { name: 'PrintFlow — Entregas', short_name: 'PrintFlow', display: 'standalone', orientation: 'portrait', ... } })`. Icons placeholders monocromáticos.

### R6: Pruebas negativas del candado con Vitest + Testing Library

**Decision**: 3 pruebas en `tests/delivery-guard.test.ts` que renderizan `DeliveryResultScreen` con diferentes fixtures y verifican que `queryByTestId('delivery-confirm')` devuelve `null`.

**Rationale**: El documento Fase 1 §9.3 define exactamente estas 3 pruebas como entregable obligatorio. `queryByTestId` (no `getByTestId`) porque devuelve `null` si no encuentra el elemento en lugar de lanzar error. Se renderiza el componente completo para verificar que el botón no está en el DOM, no solo la lógica del guard.

**Alternatives considered**:
- Probar solo `evaluateDeliveryGuard` (unit test puro) → ⚠ No verifica que el DOM realmente no contiene el botón. Podría haber un bug en el render condicional.
- Playwright E2E → ❌ No está en scope de Fase 1 (§3 ❌ NO entra).
- Probar con `getByTestId` esperando error → ⚠ Funciona pero `queryByTestId` + `toBeNull()` es más explícito.

**Best practice**: Renderizar `DeliveryResultScreen` con cada fixture, esperar que se asiente el render, y verificar `expect(screen.queryByTestId('delivery-confirm')).toBeNull()`. Usar `describe.each` para las 3 variantes.

### R7: Modal de sesión expirada (FR-026)

**Decision**: Componente `SessionExpiredModal` que se renderiza a nivel de `AppShell` cuando `absoluteDeadline < now`. El modal es un overlay bloqueante (sin botón de cerrar, solo "Ir a login") que redirige a `/login` y limpia el store de sesión.

**Rationale**: Clarificación Q1 definió modal bloqueante. Se renderiza en `AppShell` para que esté disponible en todas las pantallas. Se usa `useEffect` con `setInterval` para verificar la expiración cada segundo (suficiente granularidad para una sesión de 12h).

**Alternatives considered**:
- Redirección automática sin modal → ❌ Clarificación Q1 eligió modal.
- Verificación solo en route guards → ⚠ No cubre el caso donde el usuario está en una pantalla sin navegar.
- Verificación en cada render → ⚠ Ineficiente. `setInterval` es mejor.

**Best practice**: `useEffect` en `AppShell` con `setInterval(checkExpiry, 1000)`. Si expira, mostrar modal. El modal tiene `role="dialog"` y `aria-modal="true"`. Botón "Ir a login" llama `logout()` y navega a `/login`.
