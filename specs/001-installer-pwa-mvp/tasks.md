# Tasks: PWA Móvil del Instalador — Fase 1

**Input**: Design documents from `/specs/001-installer-pwa-mvp/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/printflow-gateway.md

**Tests**: Tests ARE included — the spec mandates 3 negative tests for the delivery guard (FR-023, SC-003). These are non-negotiable deliverables.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- PWA móvil standalone — no backend/frontend split

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Vite + React 18 + TypeScript project with `npm create vite@latest . -- --template react-ts` in repository root
- [X] T002 Install dependencies: `npm i react-router-dom zustand && npm i -D tailwindcss @tailwindcss/vite vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom jsdom` in package.json
- [X] T003 [P] Configure TypeScript strict mode in tsconfig.json (strict: true, noUncheckedIndexedAccess: true, forceConsistentCasingInFileNames: true)
- [X] T004 [P] Configure Tailwind CSS with @tailwindcss/vite plugin in vite.config.ts and tailwind.config.ts
- [X] T005 [P] Configure vite-plugin-pwa in vite.config.ts with registerType: 'prompt', manifest (name: 'PrintFlow — Entregas', short_name: 'PrintFlow', display: 'standalone', orientation: 'portrait', theme_color: '#111111', background_color: '#ffffff'), placeholder monocromatic icons in public/manifest-icons/
- [X] T006 [P] Configure Vitest with jsdom environment in vite.config.ts (test: { environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.ts'] })
- [X] T007 [P] Create .gitignore with node_modules/, dist/, .env*, .DS_Store, *.log in .gitignore
- [X] T008 Create src/styles/tokens.css with CSS variables: --surface-0 (#ffffff), --surface-1 (#f5f5f5), --surface-2 (#e0e0e0), --surface-3 (#bdbdbd), --ink-strong (#111111), --ink-base (#333333), --ink-muted (#757575), --border-hairline (#d4d4d4), --border-strong (#111111) in src/styles/tokens.css
- [X] T009 [P] Create src/styles/global.css importing tokens.css and setting body to system-ui font, background var(--surface-0), color var(--ink-strong) in src/styles/global.css
- [X] T010 [P] Configure Tailwind theme.extend.colors to map to CSS variables (surface-0: 'var(--surface-0)', etc.) in tailwind.config.ts
- [X] T011 Create AGENTS.md in repository root with project context per Fase1_EMIR_App_Movil_UI.md §12 (what it is, stack, current phase, 24 hard rules) in AGENTS.md

**Checkpoint**: Project initialized, dependencies installed, config files ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T012 Create data contracts (types) in src/data/contracts.ts: Money (type alias string), OrderStatus, ScanOutcome (discriminated union), ScannedOrderDTO, RouteItemDTO (NO money fields), SessionDTO, GuardDecision — exactly per data-model.md
- [X] T013 Create gateway interface in src/data/gateway.ts: PrintflowGateway with signIn, scanOrder, confirmDelivery, getMyRoute methods — exactly per contracts/printflow-gateway.md
- [X] T014 Create mock fixtures in src/data/mocks/fixtures.ts: 7 fixtures (F1-F7) mapping orderToken to ScannedOrderDTO, plus mock route items and mock credentials (instalador@imprenta.com / demo1234) per data-model.md
- [X] T015 Create mock gateway implementation in src/data/mocks/mockGateway.ts: implement PrintflowGateway with setTimeout(Math.random() * 300 + 500) latency, use fixtures.ts data, throw Error('Credenciales inválidas') for wrong credentials, throw Error('NETWORK_ERROR') when offline
- [X] T016 Create Zustand session store in src/store/session.ts: state { session: SessionDTO | null, isOnline: boolean }, actions { login, logout, setOnline, setOffline }, selectors for session and isOnline per research.md R2
- [X] T017 [P] Create Spinner component in src/components/ui/Spinner.tsx: monocromatic CSS spinner, size prop (sm: 16px, md: 24px, lg: 32px), data-testid="spinner"
- [X] T018 [P] Create PlaceholderBox component in src/components/ui/PlaceholderBox.tsx: grey box with label between brackets, aspect ratio prop, trama diagonal option, used for [CAMERA FEED], [LOGO PLACEHOLDER] etc.
- [X] T019 [P] Create StatusBadge component in src/components/ui/StatusBadge.tsx: structural semaphor without color — variants: blocked (borde 4px + trama + "ENTREGA BLOQUEADA"), overdue (borde 4px + trama + "VENCIDO"), due-today (borde 4px + "VENCE HOY"), due-tomorrow (borde discontinuo 2px + "VENCE MAÑANA"), on-time (borde 1px + "EN TIEMPO"), authorized (borde doble 4px + [CHECK] + "AUTORIZADO"), error (borde negro 2px + [!] + título)
- [X] T020 Create Button component in src/components/ui/Button.tsx: variants (primary: bg ink-strong, secondary: border ink-strong), states (default, disabled, loading with Spinner, error), full-width option, minimum height 56px, data-testid prop, children for label
- [X] T021 [P] Create Input component in src/components/ui/Input.tsx: label persistent OUTSIDE field, placeholder inside, height 56px, full-width, type prop (text/email/password), show/hide button option for password, data-testid prop, error state (border 2px ink-strong)
- [X] T022 Create AppShell layout in src/components/layout/AppShell.tsx: header 56px with logo placeholder + connection indicator, content area, bottom nav 64px + safe-area-inset-bottom, renders SessionExpiredModal when session expires (setInterval check every 1s) per research.md R7
- [X] T023 [P] Create ConnectionIndicator in src/components/layout/ConnectionIndicator.tsx: shows "EN LÍNEA" (circle sólido) or "SIN CONEXIÓN" based on store isOnline, data-testid="connection-indicator"
- [X] T024 [P] Create BottomNav in src/components/layout/BottomNav.tsx: two destinations (Escanear, Mi Ruta), 64px height + safe-area-inset-bottom, active state with border-top 4px, data-testid="bottom-nav"
- [X] T025 [P] Create OfflineBanner in src/components/feedback/OfflineBanner.tsx: top banner "SIN CONEXIÓN" shown when !isOnline, data-testid="offline-banner"
- [X] T026 [P] Create UpdateToast in src/components/feedback/UpdateToast.tsx: bottom banner "Actualización crítica requerida. Presione aquí para reiniciar" with border 2px, data-testid="update-toast"
- [X] T027 [P] Create ErrorBoundary in src/components/feedback/ErrorBoundary.tsx: global error boundary showing "Ocurrió un error. Reinicie la aplicación e informe a Sistemas" + reload button, never blank screen, data-testid="error-boundary"
- [X] T028 [P] Create SessionExpiredModal in src/components/feedback/SessionExpiredModal.tsx: blocking modal "Sesión expirada" with single button "Ir a login" that calls logout() and navigates to /login, role="dialog" aria-modal="true", no close button, data-testid="session-expired-modal"
- [X] T029 Create App.tsx with React Router v6 routes: /login → LoginScreen, /escanear → ScannerScreen, /resultado/:orderToken → DeliveryResultScreen, /mi-ruta → MyRouteScreen, redirect / to /login, wrap in ErrorBoundary + AppShell, provide mock gateway via context in src/App.tsx
- [X] T030 [P] Create tests/setup.ts with Vitest setup: import @testing-library/jest-dom, cleanup afterEach in tests/setup.ts

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Candado de Entrega (Priority: P1) 🎯 MVP

**Goal**: El instalador escanea un QR y la app decide si puede entregar. Botón de entrega solo existe si balanceDue === "0.00" exacto.

**Independent Test**: Escanear fixture F2 (con deuda) → `queryByTestId('delivery-confirm')` es null. Escanear fixture F1 (liquidado) → botón aparece.

### Tests for User Story 1 (MANDATORY — non-negotiable deliverable)

> **NOTE: These 3 tests MUST be written FIRST, ensure they FAIL before implementation**

- [X] T031 [P] [US1] Write negative test: render DeliveryResultScreen with fixture F2 (balanceDue "1250.50"), verify queryByTestId('delivery-confirm') is null in tests/delivery-guard.test.ts
- [X] T032 [P] [US1] Write negative test: render DeliveryResultScreen with fixture F3 (balanceDue null), verify queryByTestId('delivery-confirm') is null in tests/delivery-guard.test.ts
- [X] T033 [P] [US1] Write negative test: render DeliveryResultScreen with fixture F4 (balanceDue "-100.00"), verify queryByTestId('delivery-confirm') is null in tests/delivery-guard.test.ts

### Implementation for User Story 1

- [X] T034 [US1] Implement evaluateDeliveryGuard function in src/features/delivery/deliveryGuard.ts: takes { session, isOnline, order, readAt, now }, returns GuardDecision. ALLOW only if ALL conditions true (session INSTALLER valid within 12h + online + readAt is live + status READY_FOR_DELIVERY + balanceDue === "0.00" exact). Default is DENY_INDETERMINATE. Per constitution Principle I and research.md R1.
- [X] T035 [US1] Implement BlockedDeliveryPanel ("Alerta Roja") in src/features/delivery/BlockedDeliveryPanel.tsx: container with borde 4px + trama diagonal, [LOCK] icon, title "ENTREGA BLOQUEADA", customer + product + balanceDue visible, message "El sistema impide la entrega. Solicite la liquidación y la aprobación del cobro por el administrador.", Button "Volver a escanear" + Button "Revalidar saldo" (only if isOnline), NO DeliveryConfirmButton rendered, data-testid="blocked-delivery-panel"
- [X] T036 [US1] Implement revalidation logic in BlockedDeliveryPanel: pressing "Revalidar saldo" calls gateway.scanOrder with same orderToken, shows Spinner "Revalidando…" 500-800ms, updates screen based on new balanceDue (0.00 → ClearancePanel, >0 → stays blocked, null/negative → ValidationUnavailablePanel) per FR-028
- [X] T037 [US1] Implement ClearancePanel ("Alerta Verde") in src/features/delivery/ClearancePanel.tsx: container with borde doble 4px, [CHECK] icon, title "AUTORIZADO PARA ENTREGA", message "PAGO CONFIRMADO. Saldo: $0.00", Button "Confirmar entrega física" with data-testid="delivery-confirm", height 64px, hitbox >=60x60px, NO bitácora/total/precio shown, states: loading (disabled + spinner + "Confirmando entrega…"), error (cause generic, reconsult), success (panel "Entrega registrada" + timestamp + "Escanear otro"), already-registered ("La entrega ya había sido registrada", no retry) per FR-025
- [X] T038 [US1] Implement ValidationUnavailablePanel in src/features/delivery/ValidationUnavailablePanel.tsx: shown when balanceDue is null or negative, title "VALIDACIÓN NO DISPONIBLE", message "No se pudo verificar el saldo del pedido. Contacte a soporte.", Button "Volver a escanear", NO DeliveryConfirmButton rendered, data-testid="validation-unavailable-panel"
- [X] T039 [US1] Implement NotDeliverablePanel in src/features/delivery/NotDeliverablePanel.tsx: shown when status is not READY_FOR_DELIVERY (IN_PRODUCTION, DELIVERED, PENDING_DEPOSIT), message "Este pedido no está listo para entrega", Button "Volver a escanear", NO DeliveryConfirmButton rendered, data-testid="not-deliverable-panel"
- [X] T040 [US1] Implement DeliveryResultScreen in src/features/delivery/DeliveryResultScreen.tsx: reads orderToken from route params, calls gateway.scanOrder, evaluates deliveryGuard, switch on GuardDecision: ALLOW → ClearancePanel, DENY_DEBT → BlockedDeliveryPanel, DENY_INDETERMINATE → ValidationUnavailablePanel, DENY_NOT_DELIVERABLE → NotDeliverablePanel. Per research.md R1 — switch with explicit cases, conditional rendering, NO component hidden.

**Checkpoint**: User Story 1 fully functional — candado works, 3 negative tests pass

---

## Phase 4: User Story 2 - Login del Instalador (Priority: P2)

**Goal**: Instalador ingresa credenciales, botón se habilita solo con campos válidos, sesión de 12h, sin "extender sesión".

**Independent Test**: Ingresar instalador@imprenta.com / demo1234 → redirige a /escanear. Credenciales inválidas → "Credenciales inválidas".

### Implementation for User Story 2

- [X] T041 [P] [US2] Create LoginScreen in src/features/auth/LoginScreen.tsx: header 56px with [LOGO PLACEHOLDER] max 40x40px, auth block starting 96px from top, padding 16px, Input email (label "Correo", type email, autocomplete username), Input password (label "Contraseña", type password, autocomplete current-password, [SHOW] button), Button "Iniciar sesión" full-width 56px height, text "La sesión caduca 12 horas después de iniciar sesión" below button in gray, NO "Extender sesión" button, data-testid: input-email, input-password, button-login, button-show-password
- [X] T042 [US2] Implement login validation logic in LoginScreen: button disabled until both fields syntactically valid (email regex, password non-empty), on submit call gateway.signIn, loading state (spinner + "Iniciando sesión…" + fields blocked + [SHOW] disabled), error state ("Credenciales inválidas" with role=alert, border 2px, fields retain values, NO indication which field failed), success → store session + navigate to /escanear, double-tap produces single call (disable button immediately)
- [X] T043 [US2] Implement offline state in LoginScreen: when !isOnline, show "Se requiere conexión para iniciar sesión" and keep button disabled, data-testid="offline-login-message"

**Checkpoint**: Login works with all states (default, loading, error, offline)

---

## Phase 5: User Story 3 - Escáner QR (Priority: P3)

**Goal**: Viewport placeholder tramado, retícula, panel de desarrollo con 7 fixtures, overlay offline.

**Independent Test**: Panel de desarrollo con 7 botones fixture. Cada botón navega al estado correcto.

### Implementation for User Story 3

- [X] T044 [US3] Create ScannerScreen in src/features/scanner/ScannerScreen.tsx: header 56px with title "Escanear entrega" + Button "Cerrar" (X), camera viewport (PlaceholderBox 4:3 aspect, min 288px height, trama diagonal, label "[CAMERA FEED — NO IMAGE REAL]"), retícula 224x224px centered with 4 L-corners 24px grosor 4px, help text "Escanee el código de la remisión" 16px below camera, Button Torch and Button CameraPermission each >=48x48px NOT overlapping camera
- [X] T045 [US3] Implement torch conditional rendering in ScannerScreen: const SUPPORTS_TORCH = false, when false the Torch button is NOT rendered (not disabled, not hidden — not in DOM), document that Fase 2 gets capability from track.getCapabilities().torch
- [X] T046 [US3] Implement offline overlay in ScannerScreen: when !isOnline, show opaque overlay over camera with text "Sin conexión. Muévase a un área con cobertura para validar la entrega", NO delivery controls exist under this state, data-testid="scanner-offline-overlay"
- [X] T047 [US3] Implement QR not recognized state in ScannerScreen: when scanOrder returns NOT_FOUND or INVALID_PAYLOAD, show "Código QR no reconocido" + Button "Escanear de nuevo", data-testid="qr-not-recognized"
- [X] T048 [US3] Implement development panel in ScannerScreen: visible only when import.meta.env.DEV, 7 buttons (F1-F7) each calling gateway.scanOrder with corresponding fixture orderToken, also displays mock credentials "instalador@imprenta.com / demo1234", data-testid="dev-panel"

**Checkpoint**: Scanner placeholder works, all 7 fixtures reachable from dev panel

---

## Phase 6: User Story 4 - Mi Ruta (Priority: P4)

**Goal**: Lista de entregas con solo producto y fecha, semáforo estructural, sin dinero.

**Independent Test**: Abrir Mi Ruta → no hay signos de pesos. RouteItemDTO en memoria no tiene campos de dinero.

### Implementation for User Story 4

- [X] T049 [P] [US4] Create MyRouteScreen in src/features/route/MyRouteScreen.tsx: header with title "Mi Ruta" + date + ConnectionIndicator, filter tabs "Hoy" and "Próximas", single-column list of cards, each card: padding 16px, separation 16px, shows ONLY productLabel + promisedDate + StatusBadge, NO prices/saldos/signos de pesos, ordered by promisedDate ascending, data-testid="route-list"
- [X] T050 [US4] Implement route states in MyRouteScreen: Loading (3 skeleton cards with pulse animation, no fake values), Empty ("[EMPTY] No hay instalaciones listas para entrega" + Button "Actualizar"), Offline ("Sin conexión. La ruta no puede actualizarse" + NO cached data shown), Error ("[!] No pudimos cargar Mi Ruta" + Button "Reintentar"), date null → card goes to "Datos incompletos" (NO invented date)
- [X] T051 [US4] Implement route data loading in MyRouteScreen: call gateway.getMyRoute(filter) on mount and filter change, store result in component state (NOT in global store — no money fields to leak), verify RouteItemDTO has no money fields at runtime

**Checkpoint**: Mi Ruta works with all 5 states, zero money fields visible or in memory

---

## Phase 7: User Story 5 - Componentes Globales (Priority: P5)

**Goal**: OfflineBanner, UpdateToast, ErrorBoundary, BottomNav, SessionExpiredModal integrados.

**Independent Test**: Desconectar red → OfflineBanner visible. Forzar error → ErrorBoundary visible. Sesión expira → modal aparece.

### Implementation for User Story 5

- [X] T052 [US5] Integrate OfflineBanner into AppShell: render above header when !isOnline, header shows "SIN CONEXIÓN" via ConnectionIndicator
- [X] T053 [US5] Integrate UpdateToast into AppShell: render at bottom (above BottomNav) with "Actualización crítica requerida. Presione aquí para reiniciar", visible when PWA update available (from vite-plugin-pwa registerType: 'prompt')
- [X] T054 [US5] Integrate SessionExpiredModal into AppShell: useEffect with setInterval(checkExpiry, 1000), when absoluteDeadline < now show modal, modal button calls logout() + navigate('/login'), all app actions blocked while modal visible
- [X] T055 [US5] Integrate ErrorBoundary as global wrapper in App.tsx: wraps all routes, catches any uncaught error, shows "Ocurrió un error. Reinicie la aplicación e informe a Sistemas" + reload button, never blank screen
- [X] T056 [US5] Verify header persistence: header never shows customer name or balance, ConnectionIndicator is permanent (EN LÍNEA / SIN CONEXIÓN)

**Checkpoint**: All global components integrated and working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, QA, and deployment

- [X] T057 [P] Verify zero hex literals in components: run `grep -rn '#[0-9a-fA-F]\{3,6\}' src/components/ src/features/ src/store/` — must return 0 results
- [X] T058 [P] Verify all spacing is multiple of 8px (except borders 1/2/4px): audit Tailwind classes in all components
- [X] T059 [P] Verify all interactive controls have data-testid: audit all components for data-testid props
- [X] T060 Verify layout in 320px, 360px, 390px, 430px portrait: test all screens in DevTools device toolbar
- [X] T061 Verify "Mi Ruta" has zero pesos signs: grep for $ in MyRouteScreen.tsx and route store, inspect RouteItemDTO at runtime
- [X] T062 Run `npm run test` — all 3 negative tests must pass
- [X] T063 Run `npm run build` — must pass without errors
- [X] T064 Verify no real UUIDs or PII in code: grep for UUID patterns and real-looking data in src/
- [X] T065 Deploy to Cloudflare Pages or Vercel (Free Tier): get public preview URL
- [X] T066 Run all 9 quickstart.md validation scenarios against deployed preview
- [X] T067 Create PR to main with Isaías as reviewer, include preview URL in PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Candado) is MVP — implement first
  - US2 (Login) depends on Foundational (gateway, store) — can parallel with US1
  - US3 (Scanner) depends on US1 (navigates to DeliveryResultScreen) — after US1
  - US4 (Mi Ruta) depends on Foundational only — can parallel with US1/US2
  - US5 (Globals) depends on all components existing — after US1-US4
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1 Candado)**: Foundational → US1. No dependencies on other stories. 🎯 MVP
- **US2 (P2 Login)**: Foundational → US2. Independent of US1 (but app needs login to reach scanner)
- **US3 (P3 Scanner)**: Foundational → US1 → US3 (scanner navigates to DeliveryResultScreen from US1)
- **US4 (P4 Mi Ruta)**: Foundational → US4. Independent of US1/US2/US3
- **US5 (P5 Globals)**: Foundational → US1-US4 → US5 (integrates all components)

### Within Each User Story

- Tests FIRST (for US1 — mandatory), ensure they FAIL
- Guard/logic before UI components
- Panels before screen that orchestrates them
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1: T003-T007, T009-T010 can run in parallel (config files)
- Phase 2: T017-T019, T021, T023-T028, T030 can run in parallel (independent components)
- Phase 3: T031-T033 (3 tests) can run in parallel
- Phase 4-6: US2, US4 can run in parallel with US1 (different files, no dependencies)

---

## Parallel Example: User Story 1

```bash
# Launch all 3 negative tests together (they test different fixtures):
Task: "T031 negative test F2 (deuda) in tests/delivery-guard.test.ts"
Task: "T032 negative test F3 (null) in tests/delivery-guard.test.ts"
Task: "T033 negative test F4 (sobrepago) in tests/delivery-guard.test.ts"

# After tests fail, implement in order:
Task: "T034 deliveryGuard.ts (the logic)"
Task: "T035-T039 panels (can overlap if different files)"
Task: "T040 DeliveryResultScreen (orchestrates all panels)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Candado) + 3 negative tests
4. **STOP and VALIDATE**: Test candado independently — `npm run test` passes
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Candado) → Test independently (3 tests pass)
3. Add US2 (Login) → Test login flow
4. Add US3 (Scanner) → Test scanner + dev panel + all 7 fixtures
5. Add US4 (Mi Ruta) → Test zero money fields + semáforo
6. Add US5 (Globals) → Test offline, error boundary, session expiry
7. Polish → QA de anchos, build, deploy, PR

### 5-Day Plan Alignment

| Day | Phase | Tasks |
|-----|-------|-------|
| **Día 1** | Setup + Foundational (partial) | T001-T011, T017-T021 |
| **Día 2** | Foundational (rest) + US2 Login | T012-T016, T022-T030, T041-T043 |
| **Día 3** | US3 Scanner | T044-T048 |
| **Día 4** | US1 Candado (INTOCABLE) | T031-T040 + `npm run test` |
| **Día 5** | US4 Mi Ruta + US5 Globals + Polish | T049-T067 |

**Si va apretado de tiempo, el día 4 es intocable.** Prefiero que "Mi Ruta" quede a medias antes que un candado mal implementado.
