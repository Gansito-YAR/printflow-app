# Implementation Plan: PWA Móvil del Instalador — Fase 1

**Branch**: `001-installer-pwa-mvp` | **Date**: 2026-08-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-installer-pwa-mvp/spec.md`

## Summary

Maquetado UI/UX sin color de la PWA móvil del instalador de PrintFlow AI. 5 pantallas navegables (Login, Escáner QR, Alerta Roja/Bloqueo, Alerta Verde/Autorización, Mi Ruta) en escala de grises con datos falsos servidos via mocks. La pieza central es el candado de entrega (`deliveryGuard.ts`) que decide si el botón "Confirmar entrega física" se renderiza o no en el DOM. Sin backend real — todo a través de la interfaz `PrintflowGateway`.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode (React 18 + Vite)

**Primary Dependencies**: React 18, Vite 5, React Router v6, Zustand, Tailwind CSS, vite-plugin-pwa, Vitest, @testing-library/react, @testing-library/jest-dom, jsdom

**Storage**: N/A (Fase 1 — sin Supabase, sin persistencia real. Estado en memoria via Zustand. La sesión se mantiene en store en memoria, no en localStorage.)

**Testing**: Vitest + @testing-library/react. Pruebas negativas del candado obligatorias (3 pruebas). No hay pruebas E2E en esta fase.

**Target Platform**: PWA móvil, portrait obligatorio. Navegadores modernos con soporte PWA (Chrome/Safari/Edge). Frame rector 360x800px, QA en 320, 390 y 430px.

**Project Type**: mobile-app (PWA — Progressive Web App)

**Performance Goals**: Spinners visibles con latencia mock de 500-800ms. Navegación instantánea entre pantallas. Sin bloqueos de UI.

**Constraints**: Cero color (solo grises via tokens.css). Cero `fetch`, cero Supabase, cero llamadas de red reales. Cero cámara real. TypeScript strict, prohibido `any` en contratos. Espaciado múltiplo de 8. Sin animaciones, sin Google Fonts, solo system-ui.

**Scale/Scope**: 2 instaladores. 5 pantallas + componentes globales. 7 fixtures mock. 3 pruebas Vitest. 1 preview deploy.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Candado de Entrega | ✅ PASS | FR-001, FR-002, FR-023, FR-028, FR-025 cubren el candado. `deliveryGuard.ts` se implementa con render condicional estricto. |
| II. Integridad del Dinero | ✅ PASS | `Money = string` en contracts.ts. FR-003 prohíbe number. La app no calcula saldo. |
| III. Confidencialidad Financiera | ✅ PASS | `RouteItemDTO` no tiene campos de dinero. FR-004 prohíbe signos de pesos en Mi Ruta. |
| IV. Visual Sin Color | ✅ PASS | `tokens.css` con variables CSS. FR-005, FR-006, FR-007, FR-008, FR-009 definen restricciones visuales. |
| V. Alcance de Fase | ✅ PASS | FR-010 prohíbe fetch/Supabase. FR-016 prohíbe cámara real. FR-024 limita PWA a manifest. |
| VI. Calidad Técnica | ✅ PASS | TypeScript strict, data-testid, commits en español, PR con Isaías. FR-021, FR-022. |

**Gate Result**: ✅ ALL PASS — Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-installer-pwa-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── printflow-gateway.md
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
printflow-app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx           # variantes + estados Disabled/Loading/Error
│   │   │   ├── Input.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── PlaceholderBox.tsx
│   │   │   └── StatusBadge.tsx      # semáforo estructural sin color
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # header 56px + bottom nav 64px
│   │   │   ├── ConnectionIndicator.tsx
│   │   │   └── BottomNav.tsx
│   │   └── feedback/
│   │       ├── ErrorBoundary.tsx
│   │       ├── OfflineBanner.tsx
│   │       ├── UpdateToast.tsx
│   │       └── SessionExpiredModal.tsx
│   ├── features/
│   │   ├── auth/LoginScreen.tsx
│   │   ├── scanner/ScannerScreen.tsx
│   │   ├── delivery/
│   │   │   ├── DeliveryResultScreen.tsx     # decide qué panel montar
│   │   │   ├── BlockedDeliveryPanel.tsx     # "Alerta Roja"
│   │   │   ├── ClearancePanel.tsx           # "Alerta Verde"
│   │   │   ├── ValidationUnavailablePanel.tsx
│   │   │   └── deliveryGuard.ts             # ← la función más importante del repo
│   │   └── route/MyRouteScreen.tsx
│   ├── data/
│   │   ├── contracts.ts             # tipos DTO — NO los cambies sin Isaías
│   │   ├── gateway.ts               # interfaz que después implementa la API real
│   │   └── mocks/
│   │       ├── mockGateway.ts
│   │       └── fixtures.ts
│   ├── store/
│   │   └── session.ts               # Zustand: sesión y estado de conexión
│   ├── styles/
│   │   ├── tokens.css
│   │   └── global.css
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── tests/
│   └── delivery-guard.test.ts       # 3 pruebas negativas obligatorias
├── public/
│   └── manifest-icons/              # placeholders monocromáticos
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── AGENTS.md
```

**Structure Decision**: Single project (Option 1) — PWA móvil standalone. No hay separación backend/frontend porque el backend no existe en esta fase. La estructura de carpetas sigue exactamente la definida en `Fase1_EMIR_App_Movil_UI.md` §7. Se añade `SessionExpiredModal.tsx` (FR-026) y `routes.tsx` para centralizar el ruteo.

## Complexity Tracking

> No hay violaciones de constitution que justificar. Todas las decisiones se alinean con los 6 principios.

## Implementation Strategy

**MVP First**: El User Story 1 (Candado de Entrega) es el MVP. Si solo se implementa ese, ya hay valor demostrable. Las demás historias se construyen incrementalmente sobre esta base.

**Orden de implementación sugerido** (alineado con el plan de 5 días del documento Fase 1):

1. **Día 1 — Setup**: Vite + TS + Tailwind + Router + Zustand + tokens.css + AppShell + UI components + AGENTS.md
2. **Día 2 — Data layer**: contracts.ts, gateway.ts, mocks con 7 fixtures, panel de desarrollo, Login con todos sus estados
3. **Día 3 — Escáner**: viewport placeholder, retícula, controles, overlay offline, QR no reconocido
4. **Día 4 — Candado (intocable)**: deliveryGuard.ts + 3 pantallas de resultado + 3 pruebas Vitest
5. **Día 5 — Mi Ruta + globales**: semáforo estructural, 5 estados, componentes globales, QA de anchos, build, deploy, PR

**Si va apretado de tiempo, el día 4 es intocable.** Prefiero que "Mi Ruta" quede a medias antes que un candado mal implementado.
