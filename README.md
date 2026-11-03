# RutaCuatri

Planificador de cuatrimestres con Anytime A\*. Proyecto de Fundamentos de IA.

- Empieza por `docs/para-que-sirve.md` y luego `docs/decisiones.md`.
- El modelo formal está en `docs/proyecto.md`.
- Los datos oficiales están en `public/datos/` y los casos de prueba en `pruebas/`.

## Requisitos

Node 22.18 o superior (el script del experimento usa la ejecución directa de TypeScript de Node).

## Comandos

```bash
npm install          # dependencias
npm run dev          # aplicación en http://localhost:3000
npm test             # pruebas del motor (Vitest)
npm run lint         # ESLint y Prettier
npm run typecheck    # TypeScript estricto
npm run build        # exportación estática en out/
npm run experimento  # experimentos A a D, CSV en resultados/
python scripts/referencia.py   # oráculo en Python (python3 en Linux y macOS)
```
