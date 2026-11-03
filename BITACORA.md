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
