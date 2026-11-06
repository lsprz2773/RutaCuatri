# RutaCuatri

Planificador de cuatrimestres con Anytime A\*. Proyecto de Fundamentos de IA.

Dado un plan de estudios, el historial de un alumno y una meta, encuentra el plan de inscripción de menor costo (cuatrimestres más penalización por sobrecarga) respetando seriación, oferta por periodo y carga máxima.

- Empieza por `docs/para-que-sirve.md` y luego `docs/decisiones.md`.
- El modelo formal está en `docs/proyecto.md`.
- Los datos oficiales están en `public/datos/` y los casos de prueba en `pruebas/`.

## Requisitos

Node 22.18 o superior (el script del experimento y el servidor de pruebas usan la ejecución directa de TypeScript de Node). Python 3 solo para el oráculo.

## Comandos

```bash
npm install                     # dependencias
npm run dev                     # aplicación en http://localhost:3000
npm test                        # pruebas del motor con Vitest (77 casos, verificador y propiedades)
npm run lint                    # ESLint y Prettier
npm run typecheck               # TypeScript estricto
npm run build                   # exportación estática en out/
npm run servir                  # sirve out/ en http://localhost:3100
npx playwright install chromium # una sola vez, para las pruebas E2E
npm run e2e                     # Playwright contra out/ (requiere npm run build)
npm run experimento             # experimentos A a D, CSV en resultados/
python scripts/referencia.py    # oráculo en Python (python3 en Linux y macOS)
```

## Estructura

```text
src/motor/      motor de búsqueda en TypeScript puro (validación, heurística, sucesores, Weighted A*, Anytime A*)
src/worker/     Web Worker que corre el motor en el navegador
src/estado/     store de Zustand y funciones de las pantallas
src/componentes/ tarjeta de cuatrimestre, tabla de materias, mapa de seriación, gráfica de créditos
src/app/        las 10 pantallas
pruebas/        pruebas de Vitest, casos-prueba.json y e2e/ (Playwright)
scripts/        experimento.ts, servir.ts y referencia.py
resultados/     CSV de los experimentos A a D y datos del equipo
```

La integración continua (`.github/workflows/ci.yml`) corre lint, TypeScript, pruebas, experimentos, build y Playwright en cada push a `main` y en cada pull request.
