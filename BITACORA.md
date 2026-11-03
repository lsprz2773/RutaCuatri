# Bitácora de desarrollo

Registro cronológico de esta versión. Cada entrada sigue el formato de abajo, la más reciente al final.

## AAAA-MM-DD HH:MM · Paso N · Título corto

- **Hecho:** qué se hizo.
- **Decisiones:** qué se decidió sin consultar y por qué.
- **Problemas:** qué falló y cómo se resolvió.
- **Pruebas:** resultado (por ejemplo 77/77, lint ok).
- **Commit:** hash corto y mensaje.
- **Pendiente:** lo que queda para el siguiente paso.

---

## 2026-11-03 02:00 · Paso 0 · Entorno

- **Hecho:** se creó la configuración local del editor fuera del repositorio. Versiones: Node v22.20.0, npm 10.9.3, git 2.51.0.windows.1, Python 3.14.4 (comando `python`; `python3` no existe en Windows). El oráculo `python scripts/referencia.py` termina con `fallas totales: 0` en unos 3 s.
- **Decisiones:** se usa el usuario de git ya configurado en la computadora.
- **Problemas:** no hay `pdftoppm`; las imágenes de `maquetas.pdf` se extrajeron con `pypdf` para revisarlas.
- **Pruebas:** oráculo 77/77.
- **Commit:** sin commit (paso fuera del repositorio).
- **Pendiente:** paso 1.

## 2026-11-03 02:05 · Paso 1 · Git en v1

- **Hecho:** `git init` en `v1/` con rama `main` y `.gitignore` (node_modules, .next, out, coverage, test-results, playwright-report, .env*, los archivos de configuración local del editor, más `*.tsbuildinfo` y `next-env.d.ts`, que se regeneran).
- **Decisiones:** se agregaron al `.gitignore` los archivos generados `*.tsbuildinfo` y `next-env.d.ts`.
- **Problemas:** ninguno.
- **Pruebas:** no aplica.
- **Commit:** `docs: documentación inicial`.
- **Pendiente:** paso 2.

## 2026-11-03 02:17 · Paso 2 · Proyecto base

- **Hecho:** Next.js 16.4.4 (App Router, `src/`, TypeScript estricto, `output: "export"`), Tailwind 4, ESLint 9 con `eslint-config-prettier`, Prettier, Vitest 5, Zustand 5 y Zod 4, todos con versión exacta en `package.json`. Fuentes IBM Plex Sans y Mono con `next/font`. Prueba mínima de datos y `npm run build` genera `out/`.
- **Decisiones:**
  - El generador no acepta el nombre `_base` (las reglas de npm prohíben el guion bajo inicial); se generó en `_base/rutacuatri`, se movió a `v1/` y se borró `_base/`.
  - Se quitaron `cacheComponents` y `partialPrefetching` que trae la plantilla: la aplicación es una SPA estática y no los necesita.
  - `@types/node` fijado en 22 (coincide con Node 22 y lo exige Vitest 5).
  - `trailingSlash: true` para que la exportación estática genere `ruta/index.html`.
  - `allowImportingTsExtensions`: el motor importa con extensión `.ts` para que `scripts/experimento.ts` corra con `node` directamente, sin agregar otra herramienta.
  - `AGENTS.md`, que genera `next dev`, queda fuera de git.
  - `.gitattributes` con `eol=lf` para que Prettier y git no choquen en Windows.
  - Prettier ignora `docs/`, `public/datos/`, `pruebas/casos-prueba.json` y los `.md` para no tocar la documentación.
- **Problemas:** conflicto de dependencias entre Vitest 5 y `@types/node` 20; se resolvió con la versión 22.
- **Pruebas:** lint ok, typecheck ok, 1/1 prueba, build ok.
- **Commit:** `chore: proyecto base con Next.js, Tailwind, Vitest, Zustand y Zod`.
- **Pendiente:** paso 3, el motor.

## 2026-11-03 02:34 · Paso 3 · Motor y 77 casos

- **Hecho:** `src/motor` con `tipos.ts`, `problema.ts` (máscaras de bits, materias necesarias y utilidades), `validacion.ts`, `heuristica.ts`, `sucesores.ts`, `monticulo.ts`, `wastar.ts` (con `aEstrella` y `costoUniforme`) y `anytime.ts`. Esquemas Zod de los datos en `src/datos/esquemas.ts`. Pruebas en `pruebas/`: `motor.test.ts` (72 escenarios, T01 a T05, validación y eventos), `verificador.ts` (verificador de planes que trabaja con claves, sin máscaras ni funciones del motor), `azar.ts` y `propiedades.test.ts` (200 mallas al azar de 8 a 11 materias).
- **Decisiones:**
  - Los sucesores se generan en el mismo orden que el oráculo (exclusivas primero y luego combinaciones por tamaño en orden lexicográfico) y la frontera usa la misma llave de desempate, para que los planes coincidan también en número de cuatrimestres.
  - `wastar` acepta dos parámetros opcionales además del contrato: `opciones.reglas` (desactiva D06 a D08 para el experimento C y las pruebas de propiedad) y `opciones.heuristica` (h = 0, Costo Uniforme). El contrato de cuatro parámetros no cambia.
  - La validación agrega dos comprobaciones dentro de la regla 1: claves repetidas y el límite de 31 materias (D16). Los errores de oferta y créditos son los únicos que llevan a «Sin plan» (`esSinPlan`).
  - «Sin reglas» significa: entran todas las disponibles (no solo las necesarias), sin poda por dominancia y con el cuatrimestre vacío siempre. La Estadía sigue yendo sola (D09 no es parte del experimento).
  - Se agregó `"type": "module"` a `package.json` y `erasableSyntaxOnly` a `tsconfig.json` para que el motor corra con `node` sin compilar.
- **Problemas:** Node en modo de solo quitar tipos no acepta propiedades en el constructor; se reescribió el montículo.
- **Pruebas:** 77/77 casos (72 escenarios con costo, cuatrimestres, h(inicio) y créditos de sobrecarga; 5 especiales), garantía costo ≤ H·C* en cada pasada, verificador independiente en todos los planes, y las propiedades en 200 mallas (con poda = sin poda, admisibilidad, consistencia). 89 pruebas en verde, lint ok.
- **Commit:** `feat(motor): validación, heurística, sucesores y Anytime A* con los 77 casos`.
- **Pendiente:** paso 4.
