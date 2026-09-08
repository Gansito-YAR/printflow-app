<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0
- Added principles: I. Candado de Entrega, II. Integridad del Dinero, III. Confidencialidad Financiera, IV. Visual Sin Color, V. Alcance de Fase, VI. Calidad Técnica
- Added sections: Restricciones de Stack Tecnológico, Flujo de Trabajo y Revisión
- Templates requiring updates: ✅ constitution.md (this file), ⚠ spec-template.md (pending), ⚠ plan-template.md (pending), ⚠ tasks-template.md (pending)
- Follow-up TODOs: none
-->

# PrintFlow AI Constitution

## Core Principles

### I. Candado de Entrega (NON-NEGOTIABLE)

El botón "Confirmar entrega física" se renderiza SOLO si `evaluateDeliveryGuard` devuelve `ALLOW`. En cualquier otro caso el nodo NO SE INSTANCIA en el DOM.

- Prohibido: crear el botón y ocultarlo, `visibility:hidden`, `display:none` sobre un nodo montado, `opacity:0`, `aria-hidden`, sacarlo del viewport, `pointer-events:none`, o usar `disabled` como sustituto del candado.
- `ALLOW` requiere TODO simultáneamente: sesión `INSTALLER` válida dentro de 12 horas absolutas + online + lectura viva + `status === 'READY_FOR_DELIVERY'` + `balanceDue === "0.00"` exacto.
- `balanceDue` `null`, `NaN`, negativo, ausente, con error de parseo, offline u obsoleto es INDETERMINATE y se resuelve como `DENY`. Nunca como liquidado.
- El valor por defecto de cualquier decisión de autorización es `DENY`.
- Bajo `DENY_*`, el componente, su listener y la referencia a la mutación no forman parte del árbol renderizado.
- Pruebas negativas obligatorias en Vitest: con deuda, con saldo `null` y con sobrepago, `queryByTestId('delivery-confirm')` debe devolver `null`.

**Rationale:** Esta es la razón de existir de la app. Entre el 5% y 8% de las ventas anuales se pierden por entregas con saldo pendiente. El candado es la primera barrera; el trigger de PostgreSQL es la segunda.

### II. Integridad del Dinero

El dinero viaja como `string` decimal de 2 posiciones (`"0.00"`, `"1250.50"`). Nunca como `number`.

- Prohibido comparar saldos con tolerancias de punto flotante o redondear para decidir.
- La app NUNCA calcula el saldo. Lo lee. La autoridad es la base de datos.
- `Money` se define como `type Money = string` en `contracts.ts`.
- Los tipos de `src/data/contracts.ts` no se modifican sin aprobación de Isaías.

**Rationale:** Los floats binarios no sirven para decidir si alguien pagó. Un saldo de `$0.00` debe ser exactamente cero, no `0.0000001`.

### III. Confidencialidad Financiera

La pantalla "Mi Ruta" no muestra ni solicita total, saldo, abonos, método de pago ni ningún signo de pesos. Solo producto y fecha pactada.

- El header persistente nunca muestra nombre de cliente ni saldo.
- El instalador nunca registra cobros. No existe esa acción en esta app.
- `RouteItemDTO` no contiene campos de dinero — ni siquiera se solicitan al gateway.
- Tampoco se guardan en memoria o estado.

**Rationale:** Política de confidencialidad (RLS). Los instaladores no ven el dinero de la imprenta.

### IV. Visual Sin Color

Cero color de marca. Todos los colores salen de variables en `src/styles/tokens.css` (escala de grises).

- Prohibido un hex literal en un componente. Todo pasa por las variables CSS.
- La criticidad NO se comunica con color, sino con grosor de borde (1/2/4px), trama diagonal y etiqueta textual en mayúsculas.
- Debe entenderse impreso en blanco y negro (prueba de fuego).
- Todo espaciado es múltiplo de 8px. Excepción: bordes de 1, 2 o 4 px.
- Grid móvil: 360x800 portrait, 4 columnas, márgenes 16px, gutter 16px, header 56px, bottom nav 64px + `safe-area-inset-bottom`.
- Botón de confirmar entrega: hitbox mínimo 60x60px, alto visual 64px.
- Sin animaciones, sin fotos, sin iconos reales, sin Google Fonts. Solo `system-ui` y placeholders con label entre corchetes.

**Rationale:** No se está eligiendo estética, se está construyendo estructura. Cuando llegue la identidad visual solo se cambian variables CSS.

### V. Alcance de Fase

Fase 1 es maquetado estructural SIN color y SIN backend.

- Sin Supabase, sin autenticación real, sin `fetch`, sin llamadas de red reales. Todo pasa por la interfaz `PrintflowGateway` implementada con mocks.
- Sin cámara real, sin `getUserMedia`, sin `html5-qrcode`. El visor es una caja tramada placeholder.
- Sin Service Worker con estrategias de caché, sin Realtime, sin push, sin vibración, sin linterna real.
- No tocar el repo `printflow-admin`. El POS es de Isaías.
- Fase 2 no se inicia hasta que Fase 1 esté aprobada por Isaías.

**Rationale:** La API y el esquema de base de datos se están construyendo en paralelo. Trabajar contra `PrintflowGateway` permite cambiar la implementación sin tocar ninguna pantalla cuando la API esté lista.

### VI. Calidad Técnica

TypeScript `strict`. Prohibido `any` en contratos de datos.

- Todo control interactivo lleva `data-testid` estable.
- Ningún UUID que parezca real, ningún dato de cliente real, ninguna PII.
- Commits en español. Nunca commits directos a `main`. Pull Request con Isaías como revisor.
- `.env` nunca se sube. `.gitignore` desde el commit inicial.
- `npm run build` y `npm run test` deben pasar sin errores.
- Desplegado en preview público (Cloudflare Pages o Vercel) con enlace en el PR.

**Rationale:** El dinero y los estados de autorización necesitan tipado estricto. Los `data-testid` estables permiten pruebas E2E futuras sin fragilidad.

## Restricciones de Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | React 18 + Vite | Definido en SRS Fase 4 |
| Lenguaje | TypeScript strict | No negociable |
| Estilos | Tailwind CSS | Grid de 8 puntos |
| Ruteo | React Router v6 | |
| Estado | Zustand | Definido en SRS |
| PWA | vite-plugin-pwa | Solo manifest en Fase 1 |
| Pruebas | Vitest + Testing Library | Pruebas negativas del candado |
| Runtime | Node 20 LTS, npm | |
| Hosting | Cloudflare Pages o Vercel | Free Tier para preview |

## Flujo de Trabajo y Revisión

- Rama principal `main`. Nunca commits directos a `main`.
- Ramas por feature: `chore/setup`, `feat/login`, `feat/scanner`, `feat/delivery-guard`, `feat/mi-ruta`, `feat/globales`.
- Commits en español: `feat: pantalla de bloqueo con render condicional del candado`.
- Pull Request a `main` con Isaías como revisor obligatorio.
- Criterios de aceptación (Isaías revisa exactamente esto):
  - Las 5 pantallas existen y se navega entre ellas.
  - Ningún color fuera de `tokens.css`. Búsqueda de hex literales en componentes = 0 resultados.
  - Todo espaciado es múltiplo de 8 (salvo bordes 1/2/4 px).
  - El botón de confirmar entrega mide >=60x60 px de hitbox y 64 px de alto visual.
  - Con `balanceDue = "1250.50"`, `null` o `"-100.00"`, `queryByTestId('delivery-confirm')` devuelve `null`.
  - Se puede inspeccionar el DOM en la pantalla de bloqueo y no aparece ningún nodo de botón de entrega.
  - "Mi Ruta" no contiene ni un solo signo de pesos, ni en pantalla ni en el objeto de datos.
  - Las pantallas se entienden impresas en blanco y negro.
  - Se llega a los 7 fixtures desde el panel de desarrollo.
  - Los 6 estados (`Default`/`Disabled`/`Loading`/`Error`/`Empty`/`Offline`) existen donde aplican.
  - Cada control interactivo tiene `data-testid`.
  - Layout correcto en 320, 360, 390 y 430 px de ancho, portrait.
  - Cero `fetch`, cero Supabase, cero llamadas de red reales.
  - Ningún UUID que parezca real, ningún dato de cliente real.

## Governance

La constitution tiene precedencia sobre cualquier otra práctica o preferencia. Los conflictos con la constitution son automáticamente CRITICAL en el análisis de Spec-Kit.

- Toda modificación a `src/data/contracts.ts` requiere aprobación expresa de Isaías.
- Toda modificación a esta constitution requiere documentación del cambio, aprobación y plan de migración.
- Versionado semántico: MAJOR (cambios incompatibles en principios), MINOR (nuevos principios), PATCH (clarificaciones).
- Los PRs deben verificar cumplimiento con la constitution.
- Para desarrollo runtime, consultar `CLAUDE.md` / `GEMINI.md` para la ruta al plan actual.

**Version**: 1.0.0 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-08-12
