# PrintFlow AI — Identidad Visual · Imprenta Escalante

> **Etapa 1, Fase 2.** Extracción de identidad de la fuente oficial:
> https://www.facebook.com/share/1c7HvhuMmG/ (página de Imprenta Escalante)

## Assets descargados

| Asset | Archivo | Resolución | Formato | Origen |
|---|---|---|---|---|
| Logotipo | `public/brand/logo.jpg` | 1080×1080 | JPEG | Foto de perfil de la página |
| Banner | `public/brand/banner.png` | 1708×750 | PNG | Portada de la página |

**Limitación conocida:** el `logo.jpg` tiene el fondo negro *quemado* (no es transparente) y el monograma viene rasterizado. Funciona bien sobre fondos oscuros (que son la base de la marca), pero:

> **Pedir a Andri:** el archivo original del logo — idealmente vectorial (`.svg`, `.ai` o `.pdf`) o al menos PNG con fondo transparente del monograma "E" + wordmark por separado. Mientras tanto se usa `logo.jpg` sobre superficie oscura (header, splash, iconos), donde el fondo negro del JPG se funde con el fondo de marca.

## Paleta extraída

Mediciones por muestreo de píxeles sobre los assets (script de extracción sobre regiones saturadas, no estimado a ojo):

### Color principal — Naranja imprenta

| Token | Hex | Fuente | Uso |
|---|---|---|---|
| `--brand-500` | `#F89A16` | Promedio entre `#F8A018` (logo) y `#FC8C18` (banner) | **Acción primaria**, marca, acentos |
| `--brand-600` | `#DD850A` | Derivado (hover/pressed en claro) | Estados de interacción |
| `--brand-700` | `#B56D08` | Derivado | Texto naranja sobre fondo claro (AA) |
| `--brand-300` | `#FBBC5F` | Derivado | Variante clara del acento |
| `--brand-100` | `#FCE8C4` | Derivado | Tintes suaves / fondos de acento |
| `--brand-50`  | `#FEF6E6` | Derivado | Fondo más suave del acento |

> **Nota de accesibilidad:** `#F89A16` sobre blanco da ~2.4:1 — NO sirve como texto. El naranja se usa como **fondo de acción** con tinta oscura encima (contraste ~7.5:1 vs `#1A1A1A`), o como acento de borde/marca. Cuando se necesita naranja como texto sobre claro, se usa `--brand-700` (#B56D08 ≈ 4.7:1).

### Neutros — Negro texturizado de la marca

El fondo de los assets no es negro puro: es una textura de papel/cartón oscura.

| Token | Hex | Fuente | Uso |
|---|---|---|---|
| `--neutral-900` | `#101010` | Fondo medido en logo/banner | Fondo base tema oscuro |
| `--neutral-850` | `#181818` | Fondo medido | Superficie alterna oscura / backdrop |
| `--neutral-800` | `#202020` | Textura medida | Cards en tema oscuro |
| `--neutral-700` | `#303030` | Textura medida | Bordes en oscuro |
| `--neutral-600` | `#4A4A4A` | Derivado | Texto secundario oscuro |
| `--neutral-500` | `#757575` | Escala Fase 1 | Texto terciario |
| `--neutral-300` | `#BDBDBD` | Escala Fase 1 | Bordes suaves claro |
| `--neutral-100` | `#EDEDED` | Derivado | Cards en tema claro |
| `--neutral-50`  | `#F8F8F8` | Blanco medido en assets | Fondo alterno claro |
| `--neutral-0`   | `#FFFFFF` | Escala Fase 1 | Fondo base claro |

### Estados — solo refuerzo, nunca única señal

| Token | Hex | Uso |
|---|---|---|
| `--danger-500` | `#D32F2F` | Refuerzo "Alerta Roja" (bloqueo por deuda) |
| `--danger-700` | `#B71C1C` | Texto/borde peligro sobre claro |
| `--danger-300` | `#EF5350` | Peligro legible en tema oscuro |
| `--success-500` | `#2E7D32` | Refuerzo "Alerta Verde" (autorización) |
| `--success-700` | `#1B5E20` | Texto/borde éxito sobre claro |
| `--success-300` | `#66BB6A` | Éxito legible en tema oscuro |
| `--warning-500` | `#ED6C02` | Advertencias no bloqueantes |

> **Regla (Fase 2 §4.1):** el color **se agrega como refuerzo**. La trama diagonal, el borde 4px, el borde doble, los iconos y las etiquetas en mayúsculas se conservan todos. En escala de grises, bloqueo y autorización siguen siendo distinguibles.

## Tono de la marca

- Industrial / taller: texturas de papel, negro dominante, acento naranja vivo.
- Tipografía de marca: sans-serif gruesa condensada, peso black, mayúsculas.
- Motivo distintivo: la "E" con muescas + registro de impresión (círculo con cruz) — referencia a las marcas de registro de imprenta.

## Decisiones de aplicación

- **Header/logo:** el logo se presenta sobre superficie oscura en ambos temas (su fondo es negro); en tema claro se enmarca como placa de marca.
- **theme_color / background_color (PWA):** `#101010` / `#F8F8F8` según tema; iconos con el monograma sobre fondo `#101010`.
- **No se carga nada desde Facebook.** Todos los recursos viven en `public/brand/` dentro del repo.
