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
