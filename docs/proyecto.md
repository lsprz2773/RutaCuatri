# RutaCuatri: versión final del proyecto

## Proyecto 3 · Ruta curricular por cuatrimestres (Anytime A\*)

**Título extenso:** Planificación de la trayectoria académica de un
estudiante irregular hasta cubrir su plan de estudios con el menor costo
en cuatrimestres, respetando seriación, oferta de materias y carga
máxima.

Un plan de estudios tiene N materias con créditos, prerrequisitos y
periodos del año en que se ofrecen (tres cuatrimestres por año). El
proyecto está pensado para estudiantes irregulares, que recursan o
llevan materias atrasadas, y para planes con optativas, que son los
casos en que el estudiante elige qué inscribir. En cada cuatrimestre se
inscribe un conjunto de materias elegibles sin pasar de una carga
máxima, y cargar más de lo normal tiene una penalización. Como las
combinaciones posibles por cuatrimestre son muchísimas, el sistema
entrega primero un plan rápido y después lo mejora.

### 1. PEAS

| Elemento    | Descripción                                                                                                                                                                                                                                      |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Performance | Minimizar el costo del plan (cuatrimestres más penalización por sobrecarga) y cumplir prerrequisitos, oferta y carga. Se miden también el tiempo hasta el primer plan, la calidad de cada plan mejorado, los nodos expandidos y la memoria pico. |
| Environment | Plan de estudios de 20 a 40 materias con créditos, grafo de prerrequisitos, oferta por periodo del año (1, 2 o 3), carga normal y carga máxima por cuatrimestre.                                                                                 |
| Actuators   | Inscribir un conjunto de materias (que puede estar vacío) para el cuatrimestre y avanzar al siguiente periodo.                                                                                                                                   |
| Sensors     | Historial académico (materias aprobadas), calendario de oferta y grafo de prerrequisitos.                                                                                                                                                        |

### 2. Entorno y características

| Característica | Valor          | Justificación                                                                                                                              |
|----------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Observable     | Sí, totalmente | El historial, la malla y la oferta están completos antes de planear.                                                                       |
| Agentes        | Monoagente     | Solo el planificador decide las materias de cada cuatrimestre.                                                                             |
| Determinista   | Sí             | Supuesto de planificación: las materias inscritas se aprueban. Una materia reprobada se modela como otro estado inicial en otra ejecución. |
| Episodio       | Secuencial     | Lo que se aprueba en un cuatrimestre habilita o bloquea las materias de los siguientes.                                                    |
| Estático       | Sí             | Ver el punto 3.                                                                                                                            |
| Discreto       | Sí             | Materias, créditos y cuatrimestres son valores enteros finitos.                                                                            |
| Conocido       | Sí             | Se conocen las reglas de seriación, oferta y carga.                                                                                        |

### 3. Entorno estático

La malla, los prerrequisitos, la oferta por periodo y los límites de
carga se fijan antes de planear y no cambian mientras se busca. Solo la
inscripción que elige el agente modifica el estado. Un cambio de plan o
de oferta en el mundo real se modela como un escenario nuevo con su
propio archivo.

### 4. Planteamiento y modelado

El problema es una búsqueda en el espacio de conjuntos de materias
aprobadas. Cada transición elige un subconjunto de materias: con 8
materias elegibles y una carga que permite hasta 5, hay 218 subconjuntos
posibles en un solo cuatrimestre, y eso se repite en cada nivel.
Inscribir muchas materias ahora puede adelantar el egreso pero cuesta
penalización, y posponer una materia con muchos sucesores alarga la
cadena de seriación. También se permite un cuatrimestre sin inscripción,
porque si en un periodo no se ofrece ninguna materia elegible el plan
debe esperar al siguiente.

Métricas por escenario y por valor de H: costo del plan, cuatrimestres,
sobrecarga total, nodos expandidos, tiempo hasta el primer plan, tiempo
total, cota de sobrecosto de cada pasada y comparación contra A\* en las
mallas en que A\* termina.

### 5. Estado inicial, meta, espacio de estados, transiciones, costos y heurística

- **Estado inicial:** (A₀, p₀), donde A₀ es el conjunto de materias
  aprobadas del estudiante y p₀ ∈ {1, 2, 3} es el periodo del año del
  siguiente cuatrimestre.

- **Meta:** A ⊇ G, donde G son las materias que se quiere terminar: toda
  la malla, las necesarias para la estadía o un conjunto de optativas.

- **Espacio de estados:** pares (A, p) con A ⊆ {m₁, …, m_N}. Hay a lo
  sumo 3 · 2ᴺ estados: 3,145,728 con N = 20 y cerca de 3.3 × 10¹² con N
  = 40. Los prerrequisitos dejan alcanzable solo una parte.

- **Transiciones:** elegir un conjunto S, que puede ser vacío, de
  materias no aprobadas, con prerrequisitos en A, ofrecidas en el
  periodo p y con Σ créditos(S) ≤ Cₘₐₓ: (A, p) \|— (A ∪ S, p mod 3 + 1).

- **Costo de transición:** c(S) = 1 + β · max(0, Σ créditos(S) − Cₙₒᵣₘ).
  El 1 es el cuatrimestre transcurrido y β = 0.1 es la penalización por
  cada crédito arriba de la carga normal. Un cuatrimestre vacío cuesta
  1.

- **Heurística:** h(A, p) = max( ⌈R / Cₘₐₓ⌉, L ), donde R es la suma de
  créditos de las materias necesarias que faltan (las de G no aprobadas
  y sus prerrequisitos pendientes) y L es el número de materias de la
  cadena de prerrequisitos más larga entre ellas.

**Ejemplo.** Con Cₙₒᵣₘ = 28 y Cₘₐₓ = 36, inscribir 34 créditos cuesta c
= 1 + 0.1 · (34 − 28) = 1.6. Si faltan R = 70 créditos y la cadena más
larga es Cálculo I → Cálculo II → Ecuaciones diferenciales (L = 3),
entonces h = max(⌈70 / 36⌉, 3) = max(2, 3) = 3.

**Admisibilidad y consistencia.** Todo cuatrimestre, incluso vacío,
cuesta al menos 1. En un cuatrimestre se aprueban a lo sumo Cₘₐₓ
créditos, así que faltan al menos ⌈R / Cₘₐₓ⌉ cuatrimestres. Una cadena
de L materias exige L cuatrimestres distintos, porque una materia y su
prerrequisito no pueden ir en el mismo S. Tras una transición, R baja a
lo sumo Cₘₐₓ y L baja a lo sumo 1, así que h baja a lo sumo 1 ≤ c y h(n)
≤ c(n, n') + h(n').

### 6. Por qué no es lineal

- Hay al menos tres planes de estudio distintos (tres carreras o dos
  versiones de una misma malla) en archivos CSV editables.

- Cada estudiante tiene un historial distinto, así que el estado inicial
  cambia por ejecución; una materia reprobada produce otro plan.

- La meta cambia: terminar toda la malla, llegar a la estadía o
  completar un conjunto de optativas.

- Para evitar casos triviales, las mallas deben tener en promedio al
  menos 3 materias elegibles por periodo.

- El análisis compara cómo cambia el plan al variar Cₘₐₓ, la oferta de
  una materia clave o la penalización β.

- Si una materia necesaria nunca se ofrece o su prerrequisito no se
  puede cursar, la búsqueda lo detecta y reporta que no hay plan.

### 7. Método: Anytime A\*

Anytime A\* ejecuta Weighted A\* varias veces con pesos H decrecientes.
Cada pasada ordena la frontera por f(n) = g(n) + H · h(n). La primera,
con H alto, avanza rápido hacia la meta y entrega un plan; cada pasada
siguiente reduce H y replanea para mejorarlo, descartando todo nodo con
g(n) + h(n) ≥ mejor costo, hasta llegar a H = 1, que equivale a A\* y da
el plan óptimo. Con h admisible, el plan de una pasada con peso H cuesta
como máximo H · C\*.

| Variable       | Significado en este proyecto                                                         |
|----------------|--------------------------------------------------------------------------------------|
| n = (A, p)     | Nodo de búsqueda: materias aprobadas y periodo del año                               |
| N              | Número de materias del plan de estudios                                              |
| g(n)           | Costo acumulado de los cuatrimestres planeados: cuatrimestres más penalizaciones     |
| h(n)           | max(⌈R / Cₘₐₓ⌉, L): cuatrimestres mínimos que faltan                                 |
| H              | Peso de la heurística en la pasada actual. H \> 1 empuja hacia la meta; H = 1 es A\* |
| f(n)           | g(n) + H · h(n): criterio para elegir el siguiente nodo a expandir                   |
| Secuencia de H | 3 → 2 → 1.5 → 1, un valor por pasada                                                 |
| Mejor costo    | Costo del mejor plan hallado; poda los nodos con g + h ≥ mejor costo                 |
| C\*            | Costo del plan óptimo                                                                |
| R, L           | Créditos necesarios que faltan y cadena de prerrequisitos más larga                  |
| Cₘₐₓ, Cₙₒᵣₘ, β | Carga máxima, carga normal y penalización por crédito de sobrecarga                  |
| S              | Conjunto de materias inscritas en un cuatrimestre (puede ser vacío)                  |

**Por qué Anytime A\*.** Cada estado tiene cientos de sucesores y un
estudiante necesita una respuesta de inmediato, aunque al principio sea
un poco peor. Anytime A\* entrega un plan en segundos, lo mejora con
cada pasada y conserva en todo momento una cota de calidad.

| Alternativa                              | Por qué se descarta                                                                                                                |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| BFS                                      | Cuenta cuatrimestres pero ignora la penalización por sobrecarga, y su frontera crece con los cientos de subconjuntos por nivel.    |
| Costo Uniforme                           | Óptimo, pero sin guía expande todas las combinaciones de menor costo.                                                              |
| DFS, Depth-Limited e Iterative Deepening | No consideran el costo de la sobrecarga ni garantizan un plan bueno.                                                               |
| A\*                                      | Óptimo, pero no entrega nada hasta terminar.                                                                                       |
| IDA\*                                    | Muchos caminos llegan al mismo conjunto A y sin lista de cerrados los repetiría; además, la memoria no es la limitación principal. |
| Greedy Best-First                        | Rápido, pero sin cota de calidad.                                                                                                  |
| Weighted A\* con un solo H               | Entrega un solo plan y no lo mejora.                                                                                               |

### Verificación

- La heurística no violó la admisibilidad ni la consistencia en ninguno
  de los 9,921 estados de 25 mallas aleatorias de 10 materias.

- Sin la opción de cuatrimestre vacío, 1 de esas 25 mallas no tenía plan
  aunque sí lo hay esperando un periodo.

Malla de 28 materias, Cₘₐₓ = 30 y Cₙₒᵣₘ = 22:

| Medición             | Anytime A\* (H = 3 → 2 → 1.5 → 1)                        | A\*                           | Weighted A\* (solo H = 2) |
|----------------------|----------------------------------------------------------|-------------------------------|---------------------------|
| Primer plan          | 1.2 s, costo 14.1                                        | 290.4 s, costo 8.0 (óptimo)   | 1.9 s, costo 11.2         |
| Mejora con el tiempo | 11.2 a los 3.1 s y 9.2 a los 85.1 s                      | Entrega un solo plan al final | No                        |
| Nodos expandidos     | 620, 752 y 16,783 en las tres primeras pasadas           | 114,686                       | 752                       |
| Garantía de calidad  | Costo ≤ H · C\* en cada pasada; óptimo al llegar a H = 1 | Óptimo                        | Costo ≤ 2 · C\*           |

En una malla de 20 materias, Anytime y A\* llegaron al óptimo de 7.1, y
Weighted A\* con H = 2 se quedó en 8.5. Ahí Anytime expandió 1,499 nodos
en total contra 1,109 de A\*, un 35% más por entregar respuestas
intermedias.
