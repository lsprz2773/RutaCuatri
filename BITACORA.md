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

## 2026-11-06 15:25 · Paso 6 · Experimento A a D

- **Hecho:** `scripts/experimento.ts` (se corre con `npm run experimento`; `-- --repeticiones N` cambia las 5 repeticiones). Escribe `resultados/experimento-a.csv` (72 escenarios, una fila por pasada), `experimento-b.csv` (24 escenarios M1 × 4 métodos), `experimento-c.csv` (A* con y sin D06 a D08) y `experimento-d.csv` (sensibilidad de ISW-E1), más `resultados/equipo.txt` con procesador, memoria y versión de Node. El script compara contra los valores esperados y termina con error si algo no coincide.
- **Decisiones:** el tiempo reportado es la mediana de 5 repeticiones; costos y expansiones son los de la primera corrida (no cambian). La memoria de Anytime es el máximo de estados guardados entre sus pasadas. El experimento D agrega las filas K = 5 y K = 6 de la tabla de referencia.
- **Problemas:** ninguno. Todo el experimento tarda unos 7 s; ninguna corrida llega al límite de 60 s, ni siquiera Costo Uniforme.
- **Pruebas:** el experimento D reproduce los 12 valores de referencia y el A los 72 costos óptimos. En el C, las expansiones sin reglas dan 8,644 / 1,423 / 2,807 contra 8,645 / 1,423 / 2,808 de decisiones.md (sección 3.1), con el mismo costo.
- **Commit:** `feat(experimento): experimentos A a D con CSV en resultados/`.
- **Pendiente:** revisar las pantallas 7 a 10 en el navegador, pasos 7 y 8.

## 2026-11-06 15:50 · Paso 7 · Pruebas E2E con Playwright (y revisión de las pantallas 7 a 10)

- **Hecho:** `@playwright/test` 1.65.0 y Chromium descargado. `playwright.config.ts` corre las pruebas contra la exportación estática (`out/`) con un servidor propio sin dependencias (`scripts/servir.ts`). `pruebas/e2e/flujo.spec.ts` cubre los flujos de la sección 6: Ana Ruiz recorriendo las pantallas 2 a 6 hasta el plan de 5.0 en 5 cuatrimestres (con el total de las tarjetas igual al costo), T03 que termina en Sin plan sin buscar, Detener que corta en menos de 1 s y conserva el mejor plan, y 390 px sin desplazamiento horizontal en el resultado y en las demás pantallas. Revisión manual de las pantallas 7 a 10: la alternativa elegida tiene el menor costo total, el análisis llena la sensibilidad y la comparación de métodos, y «Repruebo una» vuelve a planear desde el periodo siguiente.
- **Decisiones:** la prueba de Detener usa una malla sintética de 18 materias sin seriación (con las mallas reales la búsqueda termina en milisegundos). La comprobación de 390 px se extendió a todas las pantallas.
- **Problemas:** a 390 px las pantallas con tablas tenían desplazamiento horizontal: las casillas `sr-only` de la tabla son absolutas y escapaban del contenedor con scroll; se resolvió con `relative` en los contenedores y una columna explícita en las cuadrículas. La «Lectura» del análisis decía que nada cambiaba aunque subiera el costo; ahora menciona los cambios de costo.
- **Pruebas:** 4/4 E2E, 97/97 Vitest, lint ok, build ok.
- **Commit:** `test(e2e): flujos de Playwright y corrección de desplazamiento a 390 px`.
- **Pendiente:** paso 8.

## 2026-11-06 16:00 · Paso 8 · CI

- **Hecho:** `.github/workflows/ci.yml` con Node 22: `npm ci`, lint, TypeScript, Vitest, experimentos (una repetición, para comprobar los valores de referencia), build, Chromium y Playwright; si algo falla sube el reporte de Playwright. README con todos los comandos. No se ejecutó en GitHub.
- **Decisiones:** el experimento se incluye en la CI porque termina con error si algún valor no coincide con la referencia; con una repetición tarda unos segundos.
- **Problemas:** ninguno.
- **Pruebas:** 97/97 Vitest, 4/4 E2E, lint ok, build ok, experimento sin fallas.
- **Commit:** `ci: lint, pruebas, experimento, build y Playwright en GitHub Actions`.
- **Pendiente:** que Luis agregue el remoto, haga push y revise la primera ejecución de la CI.

## 2026-11-06 · Reporte y presentación

- **Hecho:** reporte en LaTeX en `reporte/`, a partir de la plantilla del curso (`2026_C3_07C_FIA_PLANTILLA_1`): planteamiento, PEAS, especificación de la búsqueda, implementación con un bloque de código por función del motor, cuatro casos con capturas, los cuatro experimentos con dos gráficas (pgfplots), conclusiones, anexos y referencias. `scripts/capturas.ts` toma las capturas de la interfaz con Playwright (`npm run build && npm run capturas`) y `scripts/codigo-reporte.ts` copia las funciones del motor a `reporte/codigo/` (`npm run codigo-reporte`), para que los bloques de código coincidan con el código real. Presentación de 12 diapositivas aparte.
- **Decisiones:** `reporte/` queda fuera de TypeScript, ESLint y Prettier porque `reporte/codigo/` son fragmentos sueltos. La clase `report` no define `\frontmatter` ni `\mainmatter`; se declaran vacías. Se mantuvo la ingeniería que trae la plantilla en la portada.
- **Problemas:** la columna de nombres de la tabla de materias quedaba muy angosta en las capturas; se ajustaron los anchos. No hay LaTeX instalado en el equipo, así que el reporte no se compiló aquí.
- **Pruebas:** 97/97 Vitest, 4/4 E2E, lint ok.
- **Commit:** `docs(reporte): reporte en LaTeX con capturas, código y experimentos`.
- **Pendiente:** compilar el reporte en Overleaf y revisar el PDF.

## 2026-11-06 · Compilación del reporte

- **Hecho:** se instaló MiKTeX en el equipo y el reporte compila con `pdflatex` → `bibtex` → `pdflatex` → `pdflatex`: 56 páginas, sin errores, sin cajas desbordadas y sin referencias sin resolver. Revisión visual de todas las páginas.
- **Problemas:** la plantilla original traía dos errores: opciones de idioma pasadas a `geometry` y un `$` sin cerrar en la portada (`D E$`) del archivo `.sty`; se corrigieron en la copia de `reporte/`, sin tocar la carpeta original. Se ajustaron anchos de tablas, dos conjuntos en modo matemático que no se podían partir, la gráfica de barras y las etiquetas de la gráfica del experimento A.
- **Decisiones:** el PDF y los archivos auxiliares de LaTeX quedan fuera de git; el PDF se genera al compilar.
- **Commit:** `docs(reporte): compilación limpia con pdflatex`.

## 2026-11-10 01:20 · Auditoría de experiencia de usuario y correcciones

- **Hecho:** auditoría del funcionamiento y de la experiencia de usuario, con el recorrido completo del camino feliz en el navegador (alumno de ejemplo y plan propio). Se corrigieron:
  - **Edición de claves en Plan de estudios:** la clave se aplica al salir del campo o con Enter, no con cada tecla. Antes, una clave a medio escribir podía coincidir con otra (por ejemplo, ISW12 → ISW15 → ISW150) y mezclaba los prerrequisitos, además del error de React «Encountered two children with the same key». Una clave vacía o repetida se rechaza con un aviso en la fila. Al renombrar, también se mueven su estado en el historial y su lugar en la meta de materias específicas.
  - **Planes guardados:** editar un plan abierto y volver a buscar actualiza ese plan en vez de crear un duplicado. Volver a abrir un alumno de ejemplo reemplaza su plan guardado. «Repruebo una» guarda un plan aparte con el título «… (replaneado)». Cada tarjeta muestra la fecha de guardado.
  - **Gráfica de créditos:** la etiqueta de la carga normal pasa a una leyenda arriba a la izquierda, y el número de una barra se sube cuando chocaría con la línea punteada.
  - **Meta:** ahora tiene título de página («Meta de …»), como las demás pantallas.
  - **Plan de estudios:** en escritorio, los cuatro botones de la cabecera quedan en una sola fila.
  - **Análisis:** el plan del escenario muestra la clave y el nombre de cada materia.
  - **Detalle de cuatrimestre:** se agregó navegación «← Cuatrimestre n−1 · n de N · Cuatrimestre n+1 →».
- **Decisiones:** el cambio de comportamiento en los planes guardados es intencional. Solo «Crear plan nuevo», cambiar de malla y «Repruebo una» crean un plan aparte. El mapa de seriación usa índice y clave como `key`, porque un CSV importado puede traer claves repetidas (la validación ya lo marca).
- **Problemas:** el error de hidratación con atributos `bis_skin_checked` y `bis_register` en `npm run dev` lo causa la extensión de Bitdefender del navegador, no el código. En una ventana de incógnito no aparece.
- **Pruebas:** 97/97 Vitest, 4/4 E2E, lint ok, build ok. Un script de Playwright confirmó las 23 comprobaciones de las correcciones, sin errores en la consola.
- **Commit:** `fix(interfaz): edición de claves, planes guardados sin duplicados y ajustes de la auditoría`.
- **Pendiente:** (vista celular fuera de alcance por ahora)
  - Quitar una materia deja prerrequisitos rotos.
  - No hay forma de vaciar la malla ni de quitar varias materias a la vez.
  - No se pueden editar el tipo ni la especialidad de una materia.
  - Los campos numéricos se rellenan con 1 o 0 al borrarlos.
  - «Crear plan nuevo» y «Quitar» no piden confirmación.

## 2026-11-10 02:10 · Edición de la malla, confirmaciones y campos numéricos

- **Hecho:** se atendieron los pendientes de la auditoría (la vista celular sigue fuera de alcance):
  - **Quitar materias:** al quitar una materia, ya sea con «×», con «Quitar seleccionadas» o con «Vaciar malla», se limpian los prerrequisitos que la usaban, su estado en el historial y la meta de materias específicas (`quitarMaterias` en `src/estado/derivados.ts`). Ya no quedan errores de «prerrequisito que no existe» bloqueando el paso. Aparece un aviso abajo, al centro, con «Deshacer».
  - **Edición masiva:** casillas por fila y «Seleccionar todas» para quitar varias materias a la vez, y botón «Vaciar malla» con confirmación. El selector de malla tiene la opción «Malla en blanco» (o «Malla propia» si se importó un CSV).
  - **Datos de la malla editables:** nombre de la malla, nombres de las especialidades A y B, y tipo de cada materia (obligatoria u optativa de la especialidad A o B). Con esto, una malla propia puede usar las metas por especialidad.
  - **«Agregar materia»:** lleva la vista a la fila nueva y enfoca su nombre. La materia nueva toma el nivel más alto existente.
  - **Campos numéricos** (créditos y nivel en la tabla; cargas, β y K en Meta): se pueden borrar y reescribir sin que salten a 1 o 0. Solo aplican valores válidos, y al salir del campo vacío vuelve el último valor (`CampoNumero` en `src/componentes/interaccion.tsx`).
  - **Confirmaciones:** cambiar de malla o importar un CSV con materias cargadas pide confirmación. «Crear plan nuevo», abrir un ejemplo o abrir un plan guardado preguntan antes de descartar un borrador que no coincide con ningún plan guardado. «Quitar» un plan guardado ofrece «Deshacer».
  - **Meta:** «Agregar pasada» explica por qué no agrega (H ≤ 1 o repetida). Enter también agrega la pasada.
  - **Análisis:** «Agregar fila» valida el valor (número, no negativo, K entero ≥ 1, carga normal ≤ máxima) y las filas agregadas se pueden quitar con «×».
- **Decisiones:**
  - Para quitar una materia se usa «Deshacer» en lugar de una confirmación, porque es más rápido y no se pierde nada. Las acciones masivas o que reemplazan todo («Vaciar malla», cambiar de malla, importar CSV, descartar el borrador) sí piden confirmación.
  - Las confirmaciones usan un `<dialog>` propio (`useConfirmar`), no `window.confirm`.
- **Problemas:** la tabla de materias sigue necesitando desplazamiento horizontal dentro de su tarjeta a 1440 px, igual que antes. Al hacer clic en «×» de la última columna, la tabla se desplaza y oculta la columna de clave.
- **Pruebas:** 100/100 Vitest (3 nuevas para `quitarMaterias`), 4/4 E2E, lint ok, build ok. Un script de Playwright confirmó las 33 comprobaciones del flujo, sin errores en la consola.
- **Commit:** `feat(malla): quitar varias materias con limpieza de seriación, deshacer y confirmaciones`.
- **Pendiente:**
  - Vista celular.
  - Ancho de la tabla de materias.
  - Marcar en bloque en el historial (por ejemplo, «aprobar hasta el nivel N»).
  - El botón «Compartir con tutor» descarga un JSON y abre la impresión; su nombre no lo dice.
  - El límite de 31 materias del motor no se explica antes de llegar a él.
