# Feature Specification: PWA Móvil del Instalador — Fase 1 (Maquetado)

**Feature Branch**: `001-installer-pwa-mvp`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Maquetado UI/UX sin color de la PWA móvil del instalador de PrintFlow AI. 5 pantallas navegables (Login, Escáner QR, Alerta Roja/Bloqueo, Alerta Verde/Autorización, Mi Ruta) en escala de grises con datos falsos, candado de entrega con render condicional, y componentes globales (OfflineBanner, UpdateToast, ErrorBoundary). Sin backend real — todo via mocks."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Candado de Entrega (Priority: P1)

El instalador escanea el QR de una nota de remisión. La app consulta el saldo del pedido y decide si puede entregarlo. Si el saldo es exactamente `$0.00`, se muestra la pantalla de Autorización con un botón grande de "Confirmar entrega física". Si el saldo es mayor a cero, nulo, negativo o indeterminado, se muestra la pantalla de Bloqueo y el botón de confirmar entrega **no existe en el DOM** — no está oculto, no está deshabilitado, no se instancia. El instalador solo puede volver a escanear o revalidar el saldo.

**Why this priority**: Es la razón de existir de la app. Entre el 5% y 8% de las ventas anuales se pierden por entregas con saldo pendiente. El candado es la pieza más crítica del sistema y no admite atajos ni "se arregla después".

**Independent Test**: Se puede probar escaneando un QR mock con `balanceDue = "1250.50"` y verificando con `queryByTestId('delivery-confirm')` que devuelve `null`. También escaneando con `balanceDue = "0.00"` y verificando que el botón sí aparece.

**Acceptance Scenarios**:

1. **Given** un pedido con `status = READY_FOR_DELIVERY` y `balanceDue = "0.00"`, **When** el instalador escanea el QR, **Then** se muestra la pantalla de Autorización con el botón "Confirmar entrega física" renderizado en el DOM
2. **Given** un pedido con `status = READY_FOR_DELIVERY` y `balanceDue = "1250.50"`, **When** el instalador escanea el QR, **Then** se muestra la pantalla de Bloqueo y `queryByTestId('delivery-confirm')` devuelve `null`
3. **Given** un pedido con `balanceDue = null`, **When** el instalador escanea el QR, **Then** se muestra la pantalla de Validación No Disponible y el botón de entrega no existe en el DOM
4. **Given** un pedido con `balanceDue = "-100.00"` (sobrepago/inconsistencia), **When** el instalador escanea el QR, **Then** se muestra la pantalla de Validación No Disponible y el botón de entrega no existe en el DOM
5. **Given** un pedido con `status = IN_PRODUCTION`, **When** el instalador escanea el QR, **Then** se muestra "Estado no entregable" y el botón de entrega no existe en el DOM
6. **Given** un pedido con `status = DELIVERED`, **When** el instalador escanea el QR, **Then** se muestra "Estado no entregable" y el botón de entrega no existe en el DOM
7. **Given** un QR desconocido, **When** el instalador escanea, **Then** se muestra "Código QR no reconocido" con opción de reintentar
8. **Given** un pedido bloqueado con `balanceDue = "1250.50"` y conexión activa, **When** el instalador presiona "Revalidar saldo", **Then** se muestra spinner "Revalidando…" y se reconsulta el gateway con el mismo `orderToken` sin re-escanear
9. **Given** un pedido bloqueado que al revalidar devuelve `balanceDue = "0.00"`, **When** se completa la reconsulta, **Then** la pantalla cambia a Autorización y el botón "Confirmar entrega física" aparece en el DOM
10. **Given** un pedido bloqueado sin conexión, **When** se renderiza la pantalla de Bloqueo, **Then** el botón "Revalidar saldo" no aparece en el DOM

---

### User Story 2 - Login del Instalador (Priority: P2)

El instalador abre la app e ingresa su correo y contraseña. El botón "Iniciar sesión" permanece deshabilitado hasta que ambos campos tengan contenido sintácticamente válido. Al enviar, el botón muestra un spinner y los campos se bloquean. Se informa que la sesión caduca en 12 horas. No existe botón "Extender sesión". Si las credenciales son inválidas, se muestra un mensaje general sin indicar qué campo falló. Sin conexión, el botón queda deshabilitado con mensaje "Se requiere conexión para iniciar sesión".

**Why this priority**: Necesario para acceder al sistema, pero el candado es más crítico. El login valida contra mocks en esta fase.

**Independent Test**: Se puede probar ingresando datos válidos/inválidos y verificando los estados del botón (disabled, loading, error) y el mensaje de expiración de sesión.

**Acceptance Scenarios**:

1. **Given** campos vacíos, **When** el instalador abre la pantalla de login, **Then** el botón "Iniciar sesión" está deshabilitado
2. **Given** ambos campos con contenido válido, **When** el instalador presiona "Iniciar sesión", **Then** el botón muestra spinner con "Iniciando sesión…" y los campos se bloquean
3. **Given** credenciales inválidas, **When** se recibe respuesta del mock, **Then** se muestra "Credenciales inválidas" sin indicar qué campo falló, y los campos conservan los valores
4. **Given** sin conexión, **When** el instalador intenta iniciar sesión, **Then** se muestra "Se requiere conexión para iniciar sesión" y el botón queda deshabilitado
5. **Given** login exitoso, **When** se redirige al escáner, **Then** se muestra el texto "La sesión caduca 12 horas después de iniciar sesión" en la pantalla de login

---

### User Story 3 - Escáner QR (Priority: P3)

El instalador apunta la cámara trasera al QR de la nota de remisión. La pantalla muestra un viewport placeholder tramado (no cámara real en esta fase), una retícula de cuatro esquinas en forma de L, y un botón de linterna que solo se renderiza si el hardware lo soporta (constante `SUPPORTS_TORCH = false` en Fase 1). Al "escanear" (via panel de desarrollo con 7 fixtures), se procesa el código y se navega a la pantalla de resultado. Sin conexión, se muestra overlay opaco "Sin conexión. Muévase a un área con cobertura para validar la entrega". QR no reconocido muestra "Código QR no reconocido" + "Escanear de nuevo".

**Why this priority**: Es el punto de entrada al candado, pero depende del User Story 1 para tener valor. En esta fase es un placeholder sin cámara real.

**Independent Test**: Se puede probar usando el panel de desarrollo con los 7 fixtures para navegar a cada estado sin cámara.

**Acceptance Scenarios**:

1. **Given** la pantalla de escáner abierta, **When** el instalador la visualiza, **Then** se ve el viewport tramado con "[CAMERA FEED — NO IMAGE REAL]", la retícula de 224x224px, y el texto "Escanee el código de la remisión"
2. **Given** `SUPPORTS_TORCH = false`, **When** se renderiza la pantalla, **Then** el botón de linterna no aparece en el DOM
3. **Given** sin conexión, **When** el instalador intenta escanear, **Then** se muestra overlay "Sin conexión. Muévase a un área con cobertura para validar la entrega" y no existe ningún control de entrega
4. **Given** un QR no reconocido, **When** se procesa el escaneo, **Then** se muestra "Código QR no reconocido" + acción "Escanear de nuevo"
5. **Given** modo desarrollo activo, **When** el instalador abre el panel de desarrollo, **Then** se muestran 7 botones con los fixtures: liquidado, con deuda, saldo desconocido, sobrepago, en producción, ya entregado, QR desconocido

---

### User Story 4 - Mi Ruta (Priority: P4)

El instalador ve una lista de pedidos con estado "Listo para entrega", ordenados por fecha pactada ascendente. Cada tarjeta muestra **solo producto y fecha pactada** — sin precios, sin saldos, sin signos de pesos, sin método de pago. La lista tiene semáforo estructural: vencido/hoy → borde 4px + trama + "VENCIDO"/"VENCE HOY"; mañana → borde discontinuo 2px + "VENCE MAÑANA"; después → borde 1px + "EN TIEMPO". Filtros: "Hoy" y "Próximas". Estados: Loading (skeleton cards), Empty ("No hay instalaciones listas para entrega"), Offline ("Sin conexión. La ruta no puede actualizarse"), Error ("No pudimos cargar Mi Ruta" + "Reintentar").

**Why this priority**: Útil para organización del instalador pero no bloquea entregas. La confidencialidad financiera es la restricción clave.

**Independent Test**: Se puede probar verificando que la lista no contiene ningún signo de pesos ni campos de dinero, ni en pantalla ni en el objeto de datos.

**Acceptance Scenarios**:

1. **Given** pedidos listos para entrega, **When** el instalador abre "Mi Ruta", **Then** se muestra una lista de tarjetas con producto y fecha pactada, ordenadas por fecha ascendente, sin ningún signo de pesos
2. **Given** un pedido con fecha pactada = hoy, **When** se renderiza su tarjeta, **Then** tiene borde 4px + trama diagonal + etiqueta "VENCE HOY"
3. **Given** un pedido con fecha pactada vencida, **When** se renderiza su tarjeta, **Then** tiene borde 4px + trama diagonal + etiqueta "VENCIDO"
4. **Given** un pedido con fecha pactada = mañana, **When** se renderiza su tarjeta, **Then** tiene borde discontinuo 2px + etiqueta "VENCE MAÑANA"
5. **Given** un pedido con fecha pactada futura, **When** se renderiza su tarjeta, **Then** tiene borde 1px + etiqueta "EN TIEMPO"
6. **Given** sin pedidos para el día seleccionado, **When** el instalador abre "Mi Ruta", **Then** se muestra "[EMPTY] No hay instalaciones listas para entrega" + botón "Actualizar"
7. **Given** sin conexión, **When** el instalador intenta cargar la ruta, **Then** se muestra "Sin conexión. La ruta no puede actualizarse" sin mostrar datos cacheados
8. **Given** un pedido con fecha nula, **When** se renderiza su tarjeta, **Then** va a "Datos incompletos" — no se inventa una fecha
9. **Given** el objeto `RouteItemDTO` en memoria, **When** se inspecciona, **Then** no contiene campos de total, saldo, abonos ni método de pago

---

### User Story 5 - Componentes Globales (Priority: P5)

La app tiene componentes transversales: `OfflineBanner` (banner superior "SIN CONEXIÓN"), `UpdateToast` (banner inferior "Actualización crítica requerida. Presione aquí para reiniciar"), `ErrorBoundary` global ("Ocurrió un error. Reinicie la aplicación e informe a Sistemas" + botón de recarga forzada), `BottomNav` con dos destinos (Escanear, Mi Ruta), y un header persistente de 56px que **nunca** muestra nombre de cliente ni saldo. El indicador de conexión (EN LÍNEA / SIN CONEXIÓN) es permanente en el header.

**Why this priority**: Necesarios para robustez pero no entregan valor funcional por sí mismos.

**Independent Test**: Se puede probar desconectando la red y verificando que aparece el OfflineBanner, o forzando un error y verificando que el ErrorBoundary muestra el mensaje correcto.

**Acceptance Scenarios**:

1. **Given** la app sin conexión, **When** se renderiza cualquier pantalla, **Then** se muestra el OfflineBanner y el header indica "SIN CONEXIÓN"
2. **Given** la app con conexión, **When** se renderiza cualquier pantalla, **Then** el header indica "EN LÍNEA"
3. **Given** un error no manejado en cualquier componente, **When** se lanza la excepción, **Then** el ErrorBoundary muestra "Ocurrió un error. Reinicie la aplicación e informe a Sistemas" + botón de recarga
4. **Given** la app en cualquier pantalla excepto login, **When** se renderiza el BottomNav, **Then** se muestran dos opciones: "Escanear" y "Mi Ruta"
5. **Given** el header persistente, **When** se navega entre pantallas, **Then** nunca se muestra nombre de cliente ni saldo en el header

---

### Edge Cases

- ¿Qué pasa cuando el instalador hace doble tap en "Confirmar entrega física"? → El botón se deshabilita inmediatamente al primer tap, mostrando spinner + "Confirmando entrega…". Solo se envía una mutación.
- ¿Qué pasa cuando otra sesión ya registró la entrega del mismo pedido? → Se muestra "La entrega ya había sido registrada". No se permite reintentar.
- ¿Qué pasa cuando falla la confirmación de entrega en el servidor? → La orden queda sin confirmar, se muestra causa genérica, se reconsulta el estado y solo se rehabilita el botón si vuelve a `ALLOW`.
- ¿Qué pasa cuando el saldo cambia entre la lectura y la confirmación? → Se reconsulta el estado. No hay éxito optimista.
- ¿Qué pasa cuando el instalador no tiene permisos de cámara? → Se muestran instrucciones para habilitarlos desde la configuración del navegador.
- ¿Qué pasa cuando la sesión expira (12 horas)? → Se muestra un modal bloqueante "Sesión expirada" con un botón que redirige a login. No hay botón "Extender sesión". Mientras el modal está visible, todas las acciones quedan bloqueadas.
- ¿Qué pasa cuando se recibe un `balanceDue` negativo (sobrepago)? → Se trata como INDETERMINATE → DENY. Se muestra Validación No Disponible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement `evaluateDeliveryGuard` que devuelve `ALLOW` solo si sesión INSTALLER válida + online + lectura viva + status READY_FOR_DELIVERY + balanceDue === "0.00" exacto. Todo lo demás es DENY.
- **FR-002**: System MUST NO renderizar el botón "Confirmar entrega física" en el DOM cuando la decisión es DENY. Prohibido: visibility:hidden, display:none, opacity:0, aria-hidden, pointer-events:none, o disabled como sustituto.
- **FR-003**: System MUST representar el dinero como string decimal de 2 posiciones ("0.00"). Nunca como number. Prohibido comparar con tolerancias de punto flotante.
- **FR-004**: System MUST NO mostrar ni solicitar total, saldo, abonos, método de pago ni signos de pesos en la pantalla "Mi Ruta". Solo producto y fecha pactada.
- **FR-005**: System MUST usar exclusivamente escala de grises via variables CSS en `tokens.css`. Prohibido hex literal en componentes.
- **FR-006**: System MUST comunicar criticidad via grosor de borde (1/2/4px), trama diagonal y etiquetas textuales en mayúsculas — nunca via color.
- **FR-007**: System MUST usar espaciado múltiplo de 8px. Excepción: bordes de 1, 2 o 4px.
- **FR-008**: System MUST funcionar en layout portrait con frame rector 360x800px y QA en 320, 360, 390 y 430px de ancho.
- **FR-009**: System MUST tener un botón de confirmar entrega con hitbox mínimo 60x60px y alto visual 64px.
- **FR-010**: System MUST servir todos los datos a traves de la interfaz `PrintflowGateway` implementada con mocks. Cero `fetch`, cero Supabase, cero llamadas de red reales.
- **FR-011**: System MUST incluir 7 fixtures mock: liquidado, con deuda, saldo desconocido, sobrepago, en producción, ya entregado, QR desconocido.
- **FR-012**: System MUST incluir un panel de desarrollo (visible solo con `import.meta.env.DEV`) con un botón por cada fixture.
- **FR-013**: System MUST deshabilitar el botón de login hasta que ambos campos (email, password) tengan contenido sintácticamente válido.
- **FR-014**: System MUST mostrar "La sesión caduca 12 horas después de iniciar sesión" bajo el botón de login. No existe botón "Extender sesión".
- **FR-015**: System MUST mostrar un solo mensaje general "Credenciales inválidas" sin indicar qué campo falló ni si la cuenta existe.
- **FR-016**: System MUST NO renderizar el botón de linterna cuando `SUPPORTS_TORCH = false`. No se deshabilita, no se renderiza.
- **FR-017**: System MUST mostrar overlay "Sin conexión. Muévase a un área con cobertura para validar la entrega" en el escáner cuando no hay conexión.
- **FR-018**: System MUST incluir ErrorBoundary global que muestre "Ocurrió un error. Reinicie la aplicación e informe a Sistemas" + botón de recarga forzada. Nunca pantalla en blanco.
- **FR-019**: System MUST incluir BottomNav con dos destinos: "Escanear" y "Mi Ruta", de 64px + safe-area-inset-bottom.
- **FR-020**: System MUST tener un header persistente de 56px que nunca muestra nombre de cliente ni saldo, con indicador permanente EN LÍNEA / SIN CONEXIÓN.
- **FR-021**: System MUST incluir `data-testid` estable en cada control interactivo.
- **FR-022**: System MUST usar datos sintéticos: [CLIENTE DEMO 01], $500.00 [DATO DEMO], [LONA 2×3 M — DEMO], [PAYLOAD_OPACO_DE_ORDEN]. Ningún UUID que parezca real, ninguna PII.
- **FR-023**: System MUST pasar 3 pruebas negativas en Vitest: con deuda (`"1250.50"`), con saldo `null`, y con sobrepago (`"-100.00"`), `queryByTestId('delivery-confirm')` devuelve `null`.
- **FR-024**: System MUST ser una PWA instalable con manifest (vite-plugin-pwa), orientation portrait, sin estrategias de caché en esta fase.
- **FR-025**: System MUST deshabilitar el botón de confirmar entrega inmediatamente al primer tap con spinner + "Confirmando entrega…". Una sola mutación. Nada de éxito optimista.
- **FR-026**: System MUST mostrar un modal bloqueante "Sesión expirada" cuando la sesión de 12 horas expira mientras el instalador está usando la app. El modal debe tener un botón que redirija a la pantalla de login. Mientras el modal está visible, todas las acciones de la app quedan bloqueadas.
- **FR-027**: System MUST aceptar credenciales mock fijas para login: email `instalador@imprenta.com` y password `demo1234`. Cualquier otra combinación devuelve error "Credenciales inválidas". Las credenciales demo deben estar visibles en el panel de desarrollo.
- **FR-028**: System MUST implementar el botón "Revalidar saldo" en la pantalla de Bloqueo para reconsultar el gateway con el mismo `orderToken` sin re-escanear. Debe mostrar spinner con texto "Revalidando…" durante la consulta. Al recibir respuesta, actualiza la pantalla según el nuevo saldo: si es `"0.00"` muestra Autorización, si sigue >0 muestra Bloqueo, si es `null`/negativo muestra Validación No Disponible. El botón solo se renderiza si hay conexión.
- **FR-029**: System MUST incluir un `OfflineBanner` que se muestre como banner superior cuando no hay conexión, con texto "SIN CONEXIÓN". Debe ser visible en todas las pantallas excepto login.
- **FR-030**: System MUST incluir un `UpdateToast` que se muestre como banner inferior (sobre el BottomNav) cuando hay una actualización crítica disponible de la PWA, con texto "Actualización crítica requerida. Presione aquí para reiniciar". Al presionar, recarga la app.

### Key Entities *(include if feature involves data)*

- **SessionDTO**: Sesión del instalador. Atributos: `userToken` (opaco), `fullName`, `role` (`INSTALLER` | `ADMIN`), `sessionStartedAt` (ISO 8601), `absoluteDeadline` (sessionStartedAt + 12h, no renovable).
- **ScannedOrderDTO**: Resultado de escanear un QR. Atributos: `orderToken` (opaco, nunca el id real), `customerLabel`, `productLabel`, `status` (`PENDING_DEPOSIT` | `IN_PRODUCTION` | `READY_FOR_DELIVERY` | `DELIVERED`), `balanceDue` (`Money | null` — null = indeterminado, nunca cero).
- **RouteItemDTO**: Item de "Mi Ruta". Atributos: `routeItemToken` (opaco), `productLabel`, `promisedDate` (ISO 8601). **NO tiene campos de dinero.**
- **ScanOutcome**: Resultado del escaneo. Variantes: `FOUND` (con ScannedOrderDTO), `NOT_FOUND`, `NETWORK_ERROR`, `INVALID_PAYLOAD`.
- **Money**: Tipo alias de `string`. Dinero como string decimal de 2 posiciones.
- **GuardDecision**: Resultado de `evaluateDeliveryGuard`. Variantes: `ALLOW`, `DENY_DEBT`, `DENY_INDETERMINATE`, `DENY_NOT_DELIVERABLE`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las 5 pantallas existen y se puede navegar entre ellas sin errores.
- **SC-002**: Búsqueda de hex literales en componentes devuelve 0 resultados (todos los colores via `tokens.css`).
- **SC-003**: Con `balanceDue = "1250.50"`, `null` o `"-100.00"`, `queryByTestId('delivery-confirm')` devuelve `null` (3 pruebas Vitest pasan).
- **SC-004**: Al inspeccionar el DOM en la pantalla de bloqueo, no aparece ningún nodo de botón de entrega.
- **SC-005**: "Mi Ruta" no contiene ni un solo signo de pesos, ni en pantalla ni en el objeto `RouteItemDTO`.
- **SC-006**: Las pantallas se entienden impresas en blanco y negro (redundancia estructural, no color).
- **SC-007**: Se puede llegar a los 7 fixtures desde el panel de desarrollo.
- **SC-008**: Los 6 estados (Default, Disabled, Loading, Error, Empty, Offline) existen donde aplican.
- **SC-009**: Layout correcto en 320, 360, 390 y 430 px de ancho, portrait.
- **SC-010**: `npm run build` y `npm run test` pasan sin errores.
- **SC-011**: Desplegado en preview público (Cloudflare Pages o Vercel) con enlace en el PR.
- **SC-012**: El botón de confirmar entrega mide >=60x60px de hitbox y 64px de alto visual.

## Clarifications

### Session 2026-08-12

- Q: ¿Qué pasa cuando la sesión expira mientras el instalador está usando la app? → A: Mostrar modal bloqueante "Sesión expirada" con botón que redirige a login.
- Q: ¿Cuánta latencia simulada tienen los mocks? → A: 500-800ms fijo para todas las operaciones mock.
- Q: ¿Qué credenciales acepta el mock de login? → A: Usuario fijo demo: instalador@imprenta.com / demo1234, visible en el panel de desarrollo.
- Q: ¿Qué hace el botón "Revalidar saldo" en la Alerta Roja? → A: Reconsultar el gateway con el mismo orderToken sin re-escanear. Muestra spinner "Revalidando…" y actualiza la pantalla según el nuevo saldo.
- Q (analyze): Documentar parámetro readAt de evaluateDeliveryGuard → A: readAt es timestamp ISO 8601 del escaneo. Lectura "viva" si now - readAt <= 60s, sino DENY_INDETERMINATE. Añadido a data-model.md.
- Q (analyze): OfflineBanner y UpdateToast sin FR explícito → A: Añadidos FR-029 (OfflineBanner) y FR-030 (UpdateToast) al spec.
- Q (analyze): FR-008 no incluía 360px en QA → A: Añadido 360px a la lista de QA en FR-008 (es el frame rector).

## Assumptions

- La API y el esquema de base de datos se están construyendo en paralelo por Isaías. En esta fase todo se sirve desde mocks.
- Los 2 instaladores usan sus propios celulares con Android/iOS. La PWA es instalable pero no se distribuye via stores.
- El contenido exacto del QR (`orderToken` opaco vs `order_id`) y la vista/RPC que alimenta "Mi Ruta" son decisiones de Isaías pendientes (gates ARQ-01, ARQ-02, ARQ-05). Por eso se trabaja contra `PrintflowGateway`.
- Los mocks incluyen latencia simulada de 500-800ms fijo para todas las operaciones, suficiente para que los spinners sean visibles sin hacer la revisión lenta.
- El panel de desarrollo es la única forma de "escanear" QRs en esta fase, ya que no hay cámara real. También muestra las credenciales mock de login (`instalador@imprenta.com` / `demo1234`).
- La identidad visual (colores, tipografía, logos) llega en Fase 2. En Fase 1 solo system-ui y escala de grises.
- El hosting del preview es Free Tier (Cloudflare Pages o Vercel), suficiente para revisión de Isaías.
