# RutaCuatri: para qué sirve y cómo funciona

Nov 1, 2026 · @Luis

## Para qué sirve

RutaCuatri responde dos preguntas de un estudiante que recursa o va
atrasado: cuántos cuatrimestres le faltan para terminar y qué le
conviene inscribir en cada uno para no atrasarse más. El ejemplo de este
documento es Ana, una alumna irregular que aprobó 6 materias y reprobó
Cálculo.

Parece sencillo, pero se complica porque tres reglas chocan entre sí:

- **Seriación:** no se puede llevar Estadística sin haber aprobado
  Cálculo.

- **Oferta:** algunas materias solo se abren en un periodo del año;
  Cálculo solo se abre en mayo.

- **Carga:** no se puede inscribir todo junto, y cargar de más tiene un
  costo.

A mano, esto significa probar combinaciones en una hoja hasta que algo
cuadre, sin saber nunca si existía una opción mejor. RutaCuatri hace esa
prueba de forma inteligente: entrega el plan con el menor número de
cuatrimestres y demuestra que no hay uno mejor. La usarían el
estudiante, su tutor o el área de control escolar para orientar a
alumnos irregulares.

## Lo que ve el usuario

1.  Carga el plan de estudios: materias, créditos, prerrequisitos y en
    qué periodos se abre cada una.

2.  Marca su historial: Ana aprobó 6 materias, reprobó Cálculo y su
    siguiente inscripción es en septiembre.

3.  Elige la meta (terminar toda la carrera) y las reglas de carga: 18
    créditos como carga normal y 26 como máximo.

4.  Presiona "Buscar" y recibe un plan cuatrimestre por cuatrimestre,
    con la explicación de por qué termina en 7.

## Qué pasa detrás

### 1. El problema se convierte en un mapa

Cada situación posible del estudiante es una "parada" del mapa, descrita
con dos datos: qué materias lleva aprobadas y en qué periodo del año
está. Eso es el estado. Ana arranca en la parada "6 aprobadas,
septiembre". La meta es cualquier parada donde ya estén aprobadas las 20
materias.

### 2. Cada cuatrimestre es un camino hacia otra parada

En septiembre, Ana puede llevar 4 materias: Inglés, Estructuras de
datos, Redes y Desarrollo web. Puede inscribir cualquier combinación de
ellas: las 4, tres, dos, una o ninguna, y cada combinación la lleva a
una parada distinta en enero. Desde cada una de esas salen otra vez
muchas combinaciones. El número de caminos crece muy rápido: con 8
materias disponibles hay más de 200 combinaciones en un solo
cuatrimestre, así que probarlas todas tardaría demasiado.

### 3. Cada camino tiene un costo

Un cuatrimestre cuesta 1, y si pasa de 18 créditos se suma una
penalización de 0.1 por cada crédito extra. El mejor plan es el camino
de menor costo total desde la parada inicial hasta la meta, que casi
siempre significa menos cuatrimestres sin sobrecargarse.

### 4. La heurística: un cálculo rápido de lo mínimo que falta

Para no probar todo a ciegas, en cada parada se calcula una cota
optimista de cuántos cuatrimestres faltan como mínimo, con dos razones:

- **Por créditos:** a Ana le faltan 85 y en un cuatrimestre caben como
  máximo 26, así que necesita al menos 4.

- **Por seriación:** tiene pendiente la cadena Cálculo → Estadística →
  Minería de datos → Aprendizaje automático → Proyecto integrador. Son 5
  materias que no pueden ir en el mismo cuatrimestre, así que necesita
  al menos 5.

Se toma el mayor de los dos: faltan al menos 5. Este cálculo nunca
exagera, y por eso el algoritmo puede confiar en él sin perder el plan
óptimo.

### 5. A\* decide qué camino revisar primero

En cada paso, A\* elige la parada más prometedora: la que tiene el menor
costo recorrido más lo mínimo que falta. Los caminos que se ven malos
casi no se exploran, así que encuentra el óptimo revisando solo una
parte pequeña de todas las combinaciones.

### 6. Anytime A\* entrega un plan rápido y luego lo mejora

En una carrera grande, A\* puede tardar minutos: con 28 materias tardó
casi 5. Por eso la búsqueda se hace en pasadas:

- **Primera pasada (H = 3):** le da mucho peso a la estimación y se va
  directo a la meta. Entrega un plan en segundos, aunque quizá no sea el
  mejor.

- **Pasadas siguientes (H = 2 y luego 1.5):** reducen ese peso y buscan
  algo mejor, descartando todo camino que ya no pueda superar al plan
  que se tiene.

- **Última pasada (H = 1):** es A\* normal. Si termina sin encontrar
  nada mejor, el plan que se tiene es el óptimo garantizado.

Con Ana, la primera pasada ya encontró el plan de 7 cuatrimestres. Las
otras tres no encontraron nada mejor, lo que demuestra que no existe uno
de 6.

### 7. El resultado se explica

La aplicación no solo da el plan, también dice por qué. Cálculo solo se
abre en mayo, y el primer mayo de Ana es su tercer cuatrimestre. A
partir de ahí, la cadena de 5 materias necesita 5 cuatrimestres
seguidos: 2 de espera más 5 dan 7. Las demás materias se acomodan
alrededor de esa cadena sin pasar de 18 créditos.

## Lo que no hace

- **Supone que el estudiante aprueba lo que inscribe.** Si reprueba
  algo, se actualiza el historial y el plan se vuelve a calcular desde
  ahí.

- **No arma horarios.** No asigna grupos, profesores ni salones; decide
  qué materias llevar en cada cuatrimestre, no a qué hora.

- **No cambia las reglas de la escuela.** Trabaja con la oferta y la
  seriación que se le cargan.

## Por qué es un problema de búsqueda completo

El proyecto reúne todos los elementos que pide el curso: un estado
compuesto (materias aprobadas y periodo), transiciones con costos
distintos, una heurística admisible que se puede demostrar, un estado
inicial y una meta configurables por ejecución, y una razón clara para
usar Anytime A\* en lugar de los otros métodos: responde de inmediato en
mallas grandes y sigue mejorando el plan hasta probar que es óptimo.
