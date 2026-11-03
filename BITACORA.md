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

## 2026-11-03 03:10 · Paso 4 · Worker, store y pantallas 1 a 6

- **Hecho:** Worker del motor (`src/worker/motor.worker.ts`, con mensajes `anytime` y `lote`), cliente del Worker, store de Zustand con persistencia en `localStorage` (`rutacuatri:v1`), gestor de búsqueda (`src/estado/busqueda.ts`: eventos en vivo, Detener = `terminate()`), datos validados con Zod al cargar, importación y exportación de CSV de malla y kárdex, y las pantallas Inicio, Plan de estudios, Historial, Meta y parámetros, Búsqueda y pasadas y Plan del estudiante, con los componentes de tarjeta de cuatrimestre, tabla de materias, mapa de seriación y gráfica de créditos en SVG (con su tabla equivalente). La pantalla 6 ya incluye la vista de celular (pantalla 10) y «Repruebo una».
- **Decisiones:**
  - Al abrir un alumno de ejemplo se usa la meta M1 (titulación con especialidad A) y el perfil regular, se lanza la búsqueda en el Worker y se va directo al resultado.
  - Las 4 metas se calculan a partir de la malla: «toda la malla» = obligatorias + optativas de la especialidad elegida + exclusivas (M1); «llegar a la estadía» = obligatorias no exclusivas (M2); «bloque de optativas» = optativas de la especialidad (M3). Una prueba comprueba que reproducen las 9 metas de `escenarios.json`.
  - Los alumnos E3 y E4 se cargan con su materia reprobada marcada como «reprobada» (01 y 11), según la tabla de la sección 1 de decisiones.md.
  - Cada búsqueda terminada (o detenida con plan) se guarda sola en «Planes guardados» (máximo 20); un caso sin plan se guarda con la etiqueta «sin plan».
  - Pesos H: la pasada con H = 1 no se puede quitar y las nuevas se ordenan de mayor a menor. El desempate por avance se muestra siempre activo (D11 no es opcional).
  - Los datos se importan en el paquete (`import` de los JSON) en lugar de pedirlos con `fetch`.
  - «Estados ≤ 3·2ⁿ» en la pantalla 4 usa n = materias pendientes, como en la maqueta; en la pantalla 2 usa el total de materias.
  - El año del plan empieza en 1 y sube cada vez que el cuatrimestre cae en enero.
- **Problemas:** el campo de prerrequisitos borraba la coma al escribir; ahora se aplica al salir del campo o con Enter. El texto de la pantalla 5 atribuía el plan final a la primera pasada; se corrigió para listar las mejoras. `tsc` revisaba la carpeta `out/`; se excluyó. Con ISW-E1, M1 y medio tiempo las pasadas dan 10.0 (17), 9.6 (22), 8.8 (77) y 8.5 (2,918); decisiones.md menciona 9.6 (23) y 8.9 (119) en las pasadas intermedias: las pasadas intermedias dependen del orden de la frontera y no se comparan; el óptimo y las 2,918 expansiones de A* coinciden.
- **Pruebas:** 94 pruebas de Vitest (se agregaron metas, Ana Ruiz con su explicación, CSV y textos), lint ok, build ok. Revisión manual en el navegador: ejemplo de Ana Ruiz (5.0 en 5), validación de malla y kárdex que bloquea «Continuar», cambio de perfil en la pantalla 4 y búsqueda en el Worker.
- **Commit:** `feat(interfaz): worker, store y pantallas 1 a 6`.
- **Pendiente:** paso 5 (detalle, análisis, sin plan; revisar la vista de celular a 390 px).

## 2026-11-03 03:25 · Paso 5 · Pantallas 7 a 10

- **Hecho:** detalle de un cuatrimestre (`/plan/resultado/[n]`, rutas 1 a 40 generadas de antemano), análisis de escenarios (sensibilidad con A* por fila, comparación de los 4 métodos, filas nuevas y «Guardar escenario»), y «Sin plan posible» con la causa y las tres opciones. La vista de celular y «Repruebo una» se hicieron en el paso 4.
- **Decisiones:** la tabla de alternativas calcula A* para la elegida, hasta 40 sucesores, «Ninguna» y «Todas», y muestra 8 filas. «Planear sin la materia» quita también las materias de la meta que dependen de ella. La sensibilidad usa el borrador actual como base.
- **Problemas:** un error de ESLint de memoización en «Sin plan»; corregido. El commit 9359c1e entró con un aviso de Prettier en un archivo; se corrigió en el commit siguiente.
- **Pruebas:** 97/97 (incluye la sensibilidad de ISW-E1 contra el experimento D y que la alternativa elegida tiene el menor costo total en cada cuatrimestre), lint ok, build ok.
- **Pendiente:** revisar en el navegador las pantallas 7 a 10 (sobre todo 390 px sin desplazamiento horizontal); pasos 6 a 8.
