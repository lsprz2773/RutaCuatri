# RutaCuatri: decisiones de desarrollo

Fecha: 3 de noviembre de 2026

Con estas 21 decisiones el proyecto queda listo para programarse sin pausas. Cada una se explica en su sección con el porqué y las alternativas descartadas. Los datos, los casos de prueba y la implementación de referencia vienen en los archivos mallas.json, escenarios.json, casos-prueba.json y referencia.py.

## Registro de decisiones

| ID | Decisión | Razón principal | Sección |
| --- | --- | --- | --- |
| D01 | Tres mallas de ingeniería de diseño propio, 28 materias cada una (5 cuatrimestres de clases y 1 de estadía) | Datos completos, coherentes y del tamaño que el modelo puede resolver | 1 |
| D02 | Oferta: niveles 1 y 2 en los tres periodos, niveles 3 a 5 en dos, optativas en uno; Inglés y Estadía en los tres | Sin elección de periodo no hay búsqueda; con oferta total no hay restricción | 1 |
| D03 | Cuatro alumnos tipo y tres metas por malla | Cumple el punto 6: cambian el inicio y la meta | 1 |
| D04 | Crédito = hora de clase por semana; Cnorm = 30, Cmax = 36, β = 0.1, K = 7 materias | Una carga de nivel completo cabe en 30; 36 permite una materia extra | 2 |
| D05 | Segundo perfil, medio tiempo: Cnorm = 24, Cmax = 30 | Es donde la búsqueda tiene que negociar entre sobrecarga y cuatrimestres | 2 |
| D06 | Solo se inscriben materias que la meta necesita | Reduce sucesores sin perder el óptimo | 3 |
| D07 | Poda por dominancia: se descarta un conjunto que todavía admite otra materia sin pasar de Cnorm | Exacta y probada en 300 mallas al azar; reduce las expansiones de A* hasta 5 veces | 3 |
| D08 | Cuatrimestre sin inscripción solo cuando no hay ninguna materia necesaria disponible | Sale de la misma dominancia; quita empates sin sentido | 3 |
| D09 | La Estadía se inscribe sola (materia exclusiva) | Así funciona la estadía en una universidad | 3 |
| D10 | Pasadas H = 3, 2, 1.5, 1; cada pasada reinicia, poda g + h ≥ mejor costo y no reabre nodos | Es el Anytime A* de clase; la pasada con H = 1 demuestra el óptimo | 3 |
| D11 | Desempate por más créditos aprobados | Entre planes de igual costo, el que adelanta más | 3 |
| D12 | Tiempo máximo de 60 s por omisión y 200,000 expansiones por pasada | Protege la memoria del navegador | 3 |
| D13 | Validación antes de buscar: oferta, créditos, ciclos y kárdex | Si pasa, siempre existe un plan | 3 |
| D14 | Alcance: las 10 pantallas de las maquetas | Decisión del profesor | 4 |
| D15 | Next.js con TypeScript, sin servidor, exportación estática en Vercel | Un solo lenguaje y el equipo ya lo domina | 5 |
| D16 | Motor en TypeScript puro dentro de un Web Worker; estado como entero de 32 bits | La interfaz no se congela y el estado ocupa un número | 5 |
| D17 | Datos en JSON validados con Zod; guardado en localStorage; importación CSV | El entorno es estático y no necesita base de datos | 5 |
| D18 | PDF con la impresión del navegador | Sin librerías y se ve igual que la pantalla | 5 |
| D19 | Vitest para el motor contra el oráculo en Python; Playwright para el flujo completo | Pruebas con respuesta conocida | 6 |
| D20 | Cuatro experimentos generados por un script que produce CSV | Los resultados se pueden repetir | 7 |
| D21 | Luis desarrolla todo; el compañero solo consulta la documentación; entrega el 4 de diciembre de 2026 | Un solo responsable del código, sin coordinar dos ramas | 8 |

## 1. Datos: las tres mallas

Se usan tres mallas de ingeniería de diseño propio, con materias de nivel universitario y 28 materias cada una. Cada malla cubre 6 cuatrimestres: 5 de clases y uno de estadía profesional, y su primer nivel se cursa en septiembre.

**Por qué de diseño propio.** Los planes oficiales no publican la oferta por periodo ni los cupos de recursamiento, que son los datos que el modelo necesita. Tres mallas construidas con la misma estructura permiten comparar resultados entre carreras sin huecos de información.

**Por qué 28 materias.** El espacio crece como 3 · 2ᴺ. Con N = 28 son hasta 805,306,368 estados, suficiente para que la búsqueda importe y todavía resoluble en el navegador. Una carrera completa de 60 materias dejaría al alumno de nuevo ingreso fuera de alcance.

| Elemento | Regla común a las tres mallas |
| --- | --- |
| Niveles 1 a 3 | 5 obligatorias por nivel |
| Niveles 4 y 5 | 4 obligatorias y un espacio de optativa por nivel |
| Especialidades | A y B, cada una con una optativa en nivel 4 y otra en nivel 5 que la tiene de prerrequisito |
| Estadía | 30 créditos, exclusiva, requiere las 23 obligatorias de los niveles 1 a 5 |
| Créditos por materia | 4 a 8 horas de clase por semana |
| Oferta (D02) | Niveles 1 y 2: Ene, May y Sep. Niveles 3 a 5: su periodo y el siguiente. Optativas: solo su periodo. Inglés y Estadía: los tres |

**Por qué esta oferta.** Con cada materia en un solo periodo el plan sale forzado y no hay nada que buscar. Con todo en los tres periodos desaparece la restricción de oferta. La regla elegida imita lo habitual: tronco común con muchos grupos, materias de especialidad con un grupo de recursamiento y optativas con un solo grupo.

### ISW · Ingeniería en Desarrollo de Software

Especialidad A: Desarrollo móvil. Especialidad B: Ciencia de datos aplicada.

| Clave | Materia | Cr | Nivel | Prerrequisitos | Oferta |
| --- | --- | --- | --- | --- | --- |
| ISW01 | Cálculo diferencial | 6 | 1 | — | Ene, May, Sep |
| ISW02 | Matemáticas discretas | 6 | 1 | — | Ene, May, Sep |
| ISW03 | Fundamentos de programación | 8 | 1 | — | Ene, May, Sep |
| ISW04 | Inglés I | 5 | 1 | — | Ene, May, Sep |
| ISW05 | Comunicación oral y escrita | 4 | 1 | — | Ene, May, Sep |
| ISW06 | Cálculo integral | 6 | 2 | ISW01 | Ene, May, Sep |
| ISW07 | Programación orientada a objetos | 8 | 2 | ISW03 | Ene, May, Sep |
| ISW08 | Bases de datos | 7 | 2 | ISW03 | Ene, May, Sep |
| ISW09 | Inglés II | 5 | 2 | ISW04 | Ene, May, Sep |
| ISW10 | Probabilidad y estadística | 6 | 2 | ISW01 | Ene, May, Sep |
| ISW11 | Estructuras de datos | 8 | 3 | ISW02, ISW07 | May, Sep |
| ISW12 | Métodos numéricos | 6 | 3 | ISW06 | May, Sep |
| ISW13 | Ingeniería de requerimientos | 5 | 3 | ISW05 | May, Sep |
| ISW14 | Desarrollo web | 7 | 3 | ISW07, ISW08 | May, Sep |
| ISW15 | Inglés III | 5 | 3 | ISW09 | Ene, May, Sep |
| ISW16 | Sistemas operativos | 7 | 4 | ISW11 | Ene, Sep |
| ISW17 | Arquitectura de software | 6 | 4 | ISW07, ISW13 | Ene, Sep |
| ISW18 | Redes de computadoras | 6 | 4 | ISW03 | Ene, Sep |
| ISW19 | Inglés IV | 5 | 4 | ISW15 | Ene, May, Sep |
| ISW20 | Pruebas de software | 6 | 5 | ISW17 | Ene, May |
| ISW21 | Seguridad informática | 6 | 5 | ISW16, ISW18 | Ene, May |
| ISW22 | Gestión de proyectos de software | 5 | 5 | ISW13 | Ene, May |
| ISW23 | Proyecto integrador | 8 | 5 | ISW14, ISW17 | Ene, May |
| ISW24 | Desarrollo móvil I (optativa A) | 6 | 4 | ISW14 | Sep |
| ISW25 | Desarrollo móvil II (optativa A) | 6 | 5 | ISW24 | Ene |
| ISW26 | Análisis de datos (optativa B) | 6 | 4 | ISW08, ISW10 | Sep |
| ISW27 | Aprendizaje automático (optativa B) | 7 | 5 | ISW26, ISW12 | Ene |
| ISW28 | Estadía profesional (exclusiva) | 30 | 6 | Las 23 obligatorias | Ene, May, Sep |

### IRC · Ingeniería en Redes y Ciberseguridad

Especialidad A: Cómputo en la nube. Especialidad B: Internet de las cosas.

| Clave | Materia | Cr | Nivel | Prerrequisitos | Oferta |
| --- | --- | --- | --- | --- | --- |
| IRC01 | Cálculo diferencial | 6 | 1 | — | Ene, May, Sep |
| IRC02 | Fundamentos de redes | 7 | 1 | — | Ene, May, Sep |
| IRC03 | Fundamentos de programación | 8 | 1 | — | Ene, May, Sep |
| IRC04 | Inglés I | 5 | 1 | — | Ene, May, Sep |
| IRC05 | Electrónica digital | 5 | 1 | — | Ene, May, Sep |
| IRC06 | Cálculo integral | 6 | 2 | IRC01 | Ene, May, Sep |
| IRC07 | Enrutamiento y conmutación | 7 | 2 | IRC02 | Ene, May, Sep |
| IRC08 | Programación de scripts | 6 | 2 | IRC03 | Ene, May, Sep |
| IRC09 | Inglés II | 5 | 2 | IRC04 | Ene, May, Sep |
| IRC10 | Arquitectura de computadoras | 6 | 2 | IRC05 | Ene, May, Sep |
| IRC11 | Sistemas operativos Linux | 7 | 3 | IRC08, IRC10 | May, Sep |
| IRC12 | Redes de área amplia | 7 | 3 | IRC07 | May, Sep |
| IRC13 | Probabilidad y estadística | 6 | 3 | IRC06 | May, Sep |
| IRC14 | Fundamentos de ciberseguridad | 6 | 3 | IRC02, IRC08 | May, Sep |
| IRC15 | Inglés III | 5 | 3 | IRC09 | Ene, May, Sep |
| IRC16 | Administración de servidores | 7 | 4 | IRC11 | Ene, Sep |
| IRC17 | Criptografía | 6 | 4 | IRC13, IRC14 | Ene, Sep |
| IRC18 | Seguridad perimetral | 6 | 4 | IRC12, IRC14 | Ene, Sep |
| IRC19 | Inglés IV | 5 | 4 | IRC15 | Ene, May, Sep |
| IRC20 | Hacking ético | 7 | 5 | IRC16, IRC18 | Ene, May |
| IRC21 | Gestión de la seguridad de la información | 5 | 5 | IRC17 | Ene, May |
| IRC22 | Respuesta a incidentes | 6 | 5 | IRC18 | Ene, May |
| IRC23 | Proyecto integrador | 8 | 5 | IRC16, IRC18 | Ene, May |
| IRC24 | Cómputo en la nube I (optativa A) | 6 | 4 | IRC11 | Sep |
| IRC25 | Cómputo en la nube II (optativa A) | 6 | 5 | IRC24 | Ene |
| IRC26 | Internet de las cosas (optativa B) | 6 | 4 | IRC10, IRC12 | Sep |
| IRC27 | Redes industriales (optativa B) | 6 | 5 | IRC26 | Ene |
| IRC28 | Estadía profesional (exclusiva) | 30 | 6 | Las 23 obligatorias | Ene, May, Sep |

### ICD · Ingeniería en Ciencia de Datos

Especialidad A: Inteligencia de negocios. Especialidad B: Procesamiento de lenguaje.

| Clave | Materia | Cr | Nivel | Prerrequisitos | Oferta |
| --- | --- | --- | --- | --- | --- |
| ICD01 | Cálculo diferencial | 6 | 1 | — | Ene, May, Sep |
| ICD02 | Álgebra lineal | 6 | 1 | — | Ene, May, Sep |
| ICD03 | Fundamentos de programación | 8 | 1 | — | Ene, May, Sep |
| ICD04 | Inglés I | 5 | 1 | — | Ene, May, Sep |
| ICD05 | Introducción a la ciencia de datos | 4 | 1 | — | Ene, May, Sep |
| ICD06 | Cálculo integral | 6 | 2 | ICD01 | Ene, May, Sep |
| ICD07 | Programación en Python | 7 | 2 | ICD03 | Ene, May, Sep |
| ICD08 | Bases de datos | 7 | 2 | ICD03 | Ene, May, Sep |
| ICD09 | Inglés II | 5 | 2 | ICD04 | Ene, May, Sep |
| ICD10 | Probabilidad | 6 | 2 | ICD01 | Ene, May, Sep |
| ICD11 | Cálculo multivariable | 6 | 3 | ICD06, ICD02 | May, Sep |
| ICD12 | Estadística inferencial | 6 | 3 | ICD10 | May, Sep |
| ICD13 | Estructuras de datos y algoritmos | 7 | 3 | ICD07 | May, Sep |
| ICD14 | Visualización de datos | 6 | 3 | ICD07, ICD05 | May, Sep |
| ICD15 | Inglés III | 5 | 3 | ICD09 | Ene, May, Sep |
| ICD16 | Optimización | 6 | 4 | ICD11, ICD02 | Ene, Sep |
| ICD17 | Aprendizaje automático | 8 | 4 | ICD12, ICD13, ICD02 | Ene, Sep |
| ICD18 | Bases de datos no relacionales | 6 | 4 | ICD08 | Ene, Sep |
| ICD19 | Inglés IV | 5 | 4 | ICD15 | Ene, May, Sep |
| ICD20 | Aprendizaje profundo | 7 | 5 | ICD17, ICD16 | Ene, May |
| ICD21 | Big data | 7 | 5 | ICD18, ICD13 | Ene, May |
| ICD22 | Ética y gobierno de datos | 4 | 5 | ICD14 | Ene, May |
| ICD23 | Proyecto integrador | 8 | 5 | ICD17, ICD18, ICD14 | Ene, May |
| ICD24 | Inteligencia de negocios (optativa A) | 6 | 4 | ICD14, ICD08 | Sep |
| ICD25 | Analítica avanzada (optativa A) | 6 | 5 | ICD24, ICD12 | Ene |
| ICD26 | Procesamiento de lenguaje natural (optativa B) | 6 | 4 | ICD13, ICD10 | Sep |
| ICD27 | Modelos de lenguaje (optativa B) | 7 | 5 | ICD26, ICD17 | Ene |
| ICD28 | Estadía profesional (exclusiva) | 30 | 6 | Las 23 obligatorias | Ene, May, Sep |

### Alumnos y metas de ejemplo (D03)

Cada malla trae los mismos cuatro alumnos tipo y las mismas tres metas, para que los resultados se comparen entre carreras. Las claves cambian solo de prefijo. La materia 01 es Cálculo diferencial en las tres mallas; la 11 es Estructuras de datos en ISW, Sistemas operativos Linux en IRC y Cálculo multivariable en ICD.

| Alumno | Quién es | Materias aprobadas | Inscribe en |
| --- | --- | --- | --- |
| E1 | Nuevo ingreso | Ninguna | Sep |
| E2 | Daniel Ortega, regular | 01 a 10 (niveles 1 y 2) | May |
| E3 | Ana Ruiz, reprobó Cálculo diferencial | 02, 03, 04, 05, 07, 08, 09 | May |
| E4 | Marco Silva, reprobó la materia 11 | 01 a 15 excepto 11 | Sep |

| Meta | Nombre | Conjunto G |
| --- | --- | --- |
| M1 | Titulación con especialidad A | Las 23 obligatorias, las 2 optativas A y la Estadía (26 materias) |
| M2 | Llegar a la estadía | Las 23 obligatorias |
| M3 | Especialidad B | Las 2 optativas B y sus prerrequisitos |

Los planes de las maquetas usaban una malla ilustrativa de 20 materias; desde ahora la aplicación carga estas tres mallas y estos alumnos como ejemplos de la pantalla de inicio.

## 2. Parámetros de carga

El perfil regular usa Cnorm = 30, Cmax = 36, β = 0.1 y K = 7. El perfil de medio tiempo usa Cnorm = 24 y Cmax = 30, con los mismos β y K. El costo de un cuatrimestre con S inscritas sigue siendo el del modelo:

```latex
c(S) = 1 + \beta \cdot \max\left(0,\ \sum_{m \in S} \mathrm{cr}(m) - C_{norm}\right)
```

| Parámetro | Regular | Medio tiempo | Por qué este valor |
| --- | --- | --- | --- |
| Crédito | 1 hora de clase por semana | igual | Es entero, se explica en una línea y cada nivel suma entre 29 y 32 |
| Cnorm (carga normal) | 30 | 24 | 30 es la carga de un nivel completo; 24 es un nivel menos una materia, la carga de quien trabaja |
| Cmax (carga máxima) | 36 | 30 | Permite una materia extra por cuatrimestre; nunca es menor que los 30 créditos de la Estadía |
| β (penalización) | 0.1 | 0.1 | Cada crédito extra cuesta una décima de cuatrimestre: 6 extra cuestan 0.6, menos que un cuatrimestre más pero no gratis |
| K (materias por cuatrimestre) | 7 | 7 | Límite de reglamento; con materias de 4 a 8 créditos casi nunca es el que corta |

**Por qué β = 0.1.** Con este valor, el alumno de nuevo ingreso de ISW termina en los 6 cuatrimestres nominales con 4 créditos de sobrecarga (costo 6.4). Con β = 0.5 el óptimo pasa a 7 cuatrimestres sin sobrecarga. Es decir, β decide entre cargar de más o alargar la carrera, y 0.1 deja como óptimo la ruta que la malla propone.

**Por qué un segundo perfil.** Con la carga regular casi todos los escenarios se resuelven en pocas expansiones, porque la malla está diseñada para cursarse en orden. Con carga de medio tiempo el alumno ya no cabe en un nivel por cuatrimestre y la búsqueda tiene que negociar entre sobrecarga y cuatrimestres. Ahí es donde Anytime A* se distingue de A*.

**Alternativas descartadas.**

- Créditos SATCA (16 horas por crédito): dan créditos con decimales y no cambian ninguna decisión del modelo.
- β = 0: la sobrecarga sería gratis y el plan siempre llenaría hasta Cmax.
- Cmax = Cnorm: desaparece la sobrecarga y, con ella, la mitad del problema.
- Pedir los parámetros al usuario sin valor por omisión: la pantalla de meta los deja editar, pero arranca con el perfil regular.

## 3. Sucesores y detalles del algoritmo

Los sucesores se generan solo con materias que la meta necesita y se descartan los conjuntos dominados. Así el óptimo no cambia y las expansiones bajan hasta 5 veces. La búsqueda es el Anytime A* de clase con cuatro pasadas.

### 3.1 Cómo se generan los sucesores (D06 a D09)

Desde el estado (A, p):

1. **Elegibles.** Son las materias que no están en A, que la meta necesita (G y sus prerrequisitos pendientes), que se abren en el periodo p y cuyos prerrequisitos están todos en A.
2. **Conjuntos.** Se arman conjuntos S de 1 a K elegibles con créditos de S ≤ Cmax. Se recorren por tamaño creciente y se corta en cuanto se pasa de Cmax. La Estadía (exclusiva) solo forma el conjunto {Estadía}.
3. **Poda por dominancia.** Se descarta S si cr(S) ≤ Cnorm, |S| < K y queda otra elegible x, fuera de S y no exclusiva, con cr(S) + cr(x) ≤ Cnorm.
4. **Cuatrimestre vacío.** El sucesor S = ∅, de costo 1, solo se genera cuando no quedó ningún conjunto.
5. **Resultado.** Cada S produce (A ∪ S, siguiente periodo) con costo c(S).

**Por qué la poda no pierde el óptimo.** Si B ⊇ B′, todo plan que sale de (B′, q) también sirve desde (B, q) quitando lo ya aprobado, con créditos iguales o menores y, por tanto, costo igual o menor. Agregar x a un S que no pasa de Cnorm deja el costo del cuatrimestre en 1 y lleva a un estado con más materias aprobadas, así que S nunca es mejor que S ∪ {x}. Lo mismo vale para el cuatrimestre vacío y para inscribir materias que la meta no usa.

**Verificación.** En 300 mallas al azar, el óptimo con y sin estas reglas fue el mismo en los 300 casos. Con el alumno de nuevo ingreso, la meta M1 y carga de medio tiempo, A* expandió:

| Malla | Sin las reglas D06 a D08 | Con las reglas | Costo óptimo |
| --- | --- | --- | --- |
| ISW | 8,645 | 2,918 | 8.5 |
| IRC | 1,423 | 393 | 8.6 |
| ICD | 2,808 | 574 | 8.5 |

**Por qué la Estadía es exclusiva (D09).** En una universidad la estadía ocupa el cuatrimestre completo. Sus 30 créditos dentro de Cmax = 36 permitirían sumarle una materia, y eso no es real.

### 3.2 Pasadas (D10)

Cada pasada es un Weighted A* desde cero con f = g + H · h, con pesos H = 3, 2, 1.5 y 1.

- **Poda.** Un sucesor con g + h ≥ mejor costo encontrado no entra a la frontera.
- **Lista cerrada.** Un estado cerrado no se vuelve a abrir dentro de la pasada.
- **Meta.** Se comprueba al sacar el estado de la frontera, no al generarlo.
- **Garantía.** El plan que encuentra la pasada con peso H cuesta como mucho H · C\*. La pasada con H = 1 es A* con heurística consistente: si encuentra un plan, es óptimo; si agota la frontera, el mejor plan anterior era óptimo.
- **Intervalo.** La pantalla muestra C\* entre h(inicio) y el mejor costo, y lo cierra cuando termina la pasada con H = 1.

Con el nuevo ingreso de ISW, meta M1 y medio tiempo, las pasadas dieron 10.0 (17 expansiones), 9.6 (23), 8.9 (119) y 8.5 (2,918). El alumno ve un plan casi al instante y el óptimo llega después.

**Por qué reiniciar cada pasada.** Reusar la frontera entre pasadas (ARA*) ahorra expansiones, pero exige reabrir nodos y llevar listas extra. Reiniciar es lo que se vio en clase, es más fácil de probar y, con la poda, cada pasada nueva es corta.

### 3.3 Desempate, límites y heurística (D11 y D12)

- **Desempate.** Entre f iguales gana el estado con más créditos aprobados, luego el de menor g y luego el que entró primero. Así el resultado es siempre el mismo y, entre planes del mismo costo, sale el que adelanta más.
- **Límites.** El tiempo máximo es de 60 s por omisión; las opciones son 60 s, 5 min y sin límite, como en la maqueta. Además, cada pasada se corta a las 200,000 expansiones para proteger la memoria. Si se corta, se conserva el mejor plan con la garantía de la pasada que lo produjo.
- **Heurística.** Queda la del modelo: h = max(⌈R / Cmax⌉, L), con R los créditos de las materias necesarias pendientes (la Estadía incluida) y L la cadena de prerrequisitos más larga entre ellas.

### 3.4 Validación antes de buscar (D13)

| Regla | Si falla |
| --- | --- |
| Toda clave de prerrequisito existe y no hay ciclos | Error en la malla, no se busca |
| Toda materia necesaria se abre en al menos un periodo | Pantalla Sin plan, con la materia como causa |
| Toda materia necesaria tiene créditos ≤ Cmax | Pantalla Sin plan, con la materia como causa |
| Toda materia aprobada tiene sus prerrequisitos aprobados | Error en el historial, se marca la materia |
| K ≥ 1, Cnorm ≤ Cmax y β ≥ 0 | Error en los parámetros |

**Por qué basta con validar.** Si las cinco reglas pasan, siempre hay un plan: se toman las materias necesarias de una en una en orden de prerrequisitos y se espera con cuatrimestres vacíos a que cada una se abra. Por eso la pantalla Sin plan sale solo de la validación, y la búsqueda nunca termina sin plan.

## 4. Alcance: las 10 pantallas (D14)

Se entregan las 10 pantallas de las maquetas funcionando con datos reales del motor; ninguna queda como imagen fija. La vista de celular no es una ruta aparte: es la pantalla de resultado adaptada a menos de 640 px.

| # | Pantalla | Ruta | Usa el motor para |
| --- | --- | --- | --- |
| 1 | Inicio | / | Nada; lee planes guardados |
| 2 | Plan de estudios | /plan/malla | Validar la malla y calcular la cadena más larga |
| 3 | Historial | /plan/historial | Validar el kárdex y listar las disponibles |
| 4 | Meta y parámetros | /plan/meta | Calcular h(inicio) y el tamaño del espacio |
| 5 | Búsqueda y pasadas | /plan/busqueda | Correr Anytime A* en el Worker |
| 6 | Plan del estudiante | /plan/resultado | Nada; muestra el mejor plan |
| 7 | Detalle de un cuatrimestre | /plan/resultado/[n] | Calcular el óptimo desde cada alternativa |
| 8 | Análisis de escenarios | /plan/analisis | Repetir la búsqueda cambiando un parámetro y comparar métodos |
| 9 | Sin plan posible | /plan/sin-plan | Mostrar la causa que encontró la validación |
| 10 | Vista en celular | /plan/resultado a menos de 640 px | Volver a planear con Repruebo una |

### Qué debe hacer cada pantalla

1. **Inicio.** Muestra los planes guardados y los 12 alumnos de ejemplo (4 por malla), y explica los 4 pasos para armar un plan. Se acepta cuando abrir un ejemplo lleva directo a su resultado y «Crear plan nuevo» abre la pantalla 2 vacía.
2. **Plan de estudios.** Tiene un selector con las 3 mallas, la tabla de materias editable, el mapa de seriación por nivel con la cadena más larga resaltada, «Agregar materia» e «Importar CSV». Se acepta cuando un error de la regla 1 de validación se marca en la fila y bloquea «Continuar».
3. **Historial.** Cada materia se marca como aprobada, reprobada o pendiente; hay «Importar kárdex» y el periodo en que se inscribe. Muestra A₀, p₀ y las materias disponibles en ese periodo. Se acepta cuando una aprobada sin sus prerrequisitos se marca y bloquea «Continuar».
4. **Meta y parámetros.** Ofrece las 4 metas (toda la malla con especialidad, llegar a la estadía, especialidad, materias específicas), Cnorm, Cmax, β y K con el perfil regular por omisión, los pesos H editables y el tiempo máximo. El resumen muestra inicio, meta, estados ≤ 3 · 2ᴺ, h(inicio) y la garantía. Se acepta cuando cambiar un parámetro actualiza el ejemplo de costo y el resumen sin recargar.
5. **Búsqueda y pasadas.** Muestra una tabla que se llena en vivo, con peso, expansiones, resultado y garantía por pasada. Incluye el intervalo de C\*, «Detener y quedarme con el mejor plan» y el enlace al plan desde que existe el primero. Se acepta cuando la interfaz sigue respondiendo durante la búsqueda y Detener corta en menos de 1 s.
6. **Plan del estudiante.** Muestra las tarjetas por cuatrimestre con materias, créditos y costo, una gráfica de créditos por cuatrimestre con la línea de Cnorm y la explicación de por qué son N cuatrimestres a partir de la cadena crítica. Incluye «Compartir con tutor» y «Descargar PDF». Se acepta cuando los totales coinciden con el costo que reportó la búsqueda.
7. **Detalle de un cuatrimestre.** Separa las disponibles en inscritas y pospuestas, cada una con lo que habilita. La tabla de alternativas tiene hasta 8 filas: la elegida, los otros sucesores, «Ninguna» y «Todas» si caben en Cmax. Cada fila trae su costo total, calculado con A* desde el estado que deja, y abajo van g, h y f del estado. Se acepta cuando la fila elegida tiene el menor costo total.
8. **Análisis de escenarios.** La tabla de sensibilidad cambia un parámetro por fila: β de 0.05, 0.2 y 0.5; Cnorm ±3 y Cmax 30, 33 y 40. Hay otra tabla que compara Anytime A*, A*, Weighted A* con H = 2 y Costo Uniforme. Se acepta cuando cada fila coincide con el oráculo en los casos de la sección 6.
9. **Sin plan posible.** Indica la causa (materia, prerrequisitos, oferta o créditos) y da tres opciones: planear sin esa materia (sale de G), cambiar la meta o editar la malla. Se acepta cuando los casos T03 y T04 terminan aquí sin entrar a la búsqueda.
10. **Vista en celular.** Es la pantalla 6 en una columna, con «Repruebo una» y «Descargar PDF» fijos abajo. «Repruebo una» pide la materia del cuatrimestre en curso, la quita de aprobadas y vuelve a buscar desde el periodo siguiente. Se acepta cuando, a 390 px de ancho, no hay desplazamiento horizontal.

### Decisiones de funciones que las maquetas dejaban abiertas

| Función | Decisión | Por qué |
| --- | --- | --- |
| Compartir con tutor | Descarga el PDF y un archivo .rutacuatri.json que se puede volver a abrir | No hay servidor ni cuentas |
| Planes guardados | localStorage, hasta 20 planes; exportar e importar JSON | El entorno es de un solo usuario |
| Importar CSV de malla | Columnas: clave, nombre, creditos, nivel, prerrequisitos (separados por ;), oferta (Ene;May;Sep), tipo, especialidad, exclusiva | Mismo orden que mallas.json |
| Importar kárdex | Columnas: clave, estado (aprobada, reprobada o pendiente) | Es lo que da cualquier sistema escolar |
| Accesibilidad | Todo se opera con teclado, contraste AA y la gráfica con tabla equivalente | Requisito mínimo de cualquier entrega web |

## 5. Tecnología y arquitectura

Todo se escribe en TypeScript dentro de una aplicación Next.js sin servidor. El motor de búsqueda es una carpeta independiente que corre en un Web Worker en el navegador y en Node para pruebas y experimentos. El entorno es estático y conocido, así que no hace falta base de datos ni API.

```text
NAVEGADOR                                   NODE
  10 pantallas (Next.js)                      Vitest y Playwright (77 casos y flujo)
    <-> Store (Zustand, localStorage)         scripts/experimento.ts (4 CSV)
    <-> Web Worker --> src/motor  <-------------- importan el motor
public/datos (mallas.json, escenarios.json, Zod) --> app
scripts/referencia.py (oráculo) --> pruebas/casos-prueba.json
```

La interfaz nunca llama al motor directamente: le manda el problema al Worker y recibe eventos. Por eso las pruebas y el experimento pueden usar el mismo motor sin navegador.

| Capa | Decisión | Por qué | Descartado |
| --- | --- | --- | --- |
| Aplicación (D15) | Next.js con App Router, TypeScript estricto y exportación estática; versión estable fijada en package.json al iniciar | El equipo ya trabaja con Next.js y queda un solo lenguaje | Backend en Python con FastAPI: dos lenguajes, un servidor que mantener y nada que guardar del lado del servidor |
| Motor (D16) | src/motor en TypeScript puro, sin React, con montículo binario propio | Se prueba solo y lo usa tanto el Worker como el script del experimento | Librerías de colas de prioridad: 50 líneas no justifican una dependencia |
| Ejecución (D16) | Web Worker con mensajes pasada-inicio, plan, pasada-fin, fin y error; Detener = terminate() | La interfaz no se congela, que es el criterio de la pantalla 5 | Correr en el hilo principal |
| Estado del motor (D16) | A como entero sin signo de 32 bits (N ≤ 31, validado); clave = A · 3 + p | Operaciones de bits nativas y una clave numérica exacta | BigInt (mucho más lento) o cadenas (más memoria) |
| Datos (D17) | public/datos/mallas.json y escenarios.json, validados con Zod al cargar | El mismo archivo que usa el oráculo | Base de datos: no hay escrituras compartidas |
| Estado de la interfaz | Zustand con persistencia en localStorage (clave rutacuatri:v1) | Un store pequeño para el plan en curso y los guardados | Context de React: más código para lo mismo |
| Estilos | Tailwind CSS e IBM Plex Sans y Mono con next/font | Son las fuentes de las maquetas | Librerías de componentes: imponen otro aspecto |
| Gráfica | SVG propio para barras de créditos | Es una sola gráfica sencilla | Librerías de gráficas |
| PDF (D18) | window.print() con hoja @media print | Sale igual que la pantalla y sin dependencias | jsPDF o PDF en servidor |
| Pruebas (D19) | Vitest para el motor y Playwright para el flujo | Ver sección 6 | Jest: más configuración con ESM |
| Calidad y publicación | ESLint, Prettier, GitHub Actions (lint, pruebas y build en cada PR) y Vercel con vista previa por PR | Nada entra a main sin pasar pruebas | Publicar a mano |

### Estructura del repositorio

```text
rutacuatri/
  src/motor/        tipos.ts, validacion.ts, heuristica.ts, sucesores.ts,
                    monticulo.ts, wastar.ts, anytime.ts
  src/worker/       motor.worker.ts
  src/app/          rutas de las 10 pantallas
  src/componentes/  tarjeta de cuatrimestre, tabla de materias,
                    mapa de seriación, gráfica de créditos
  src/estado/       store de Zustand
  public/datos/     mallas.json, escenarios.json
  pruebas/          motor.test.ts, casos-prueba.json, e2e/
  scripts/          experimento.ts, referencia.py
```

### Contrato del motor

```ts
type Periodo = 0 | 1 | 2;               // Ene, May, Sep
interface Problema { materias: Materia[]; Cnorm: number; Cmax: number;
                     beta: number; K: number; meta: number; inicio: { A: number; p: Periodo } }
validar(pb): ErrorValidacion[]          // reglas de la sección 3.4
h(pb, A): number                        // max(ceil(R / Cmax), L)
sucesores(pb, A, p): Sucesor[]          // sección 3.1
wastar(pb, H, cota, limite): Resultado  // una pasada
anytime(pb, pesos, alEvento): Resultado // emite los eventos del Worker
```

## 6. Casos de prueba con respuesta conocida (D19)

Hay 77 casos con resultado esperado: 5 especiales y 72 escenarios. Todos salieron de la implementación de referencia referencia.py, que los vuelve a calcular y hoy pasa los 77. El motor en TypeScript debe dar el mismo costo y el mismo número de cuatrimestres en cada uno. Las expansiones pueden variar por detalles del montículo, así que no se comparan.

### Casos especiales

| ID | Caso | Datos | Esperado |
| --- | --- | --- | --- |
| T01 | Mini ejemplo del diagrama | 5 materias, Cnorm = 8, Cmax = 10, β = 0.2, inicio en Sep | Costo 4.4 en 4 cuatrimestres; h(inicio) = 3 |
| T02 | Meta ya cumplida | ISW, meta M3 con sus materias aprobadas | Costo 0, plan vacío, sin búsqueda |
| T03 | Materia necesaria sin oferta | ISW con ISW23 sin periodos, meta M1 | Pantalla Sin plan, causa ISW23 |
| T04 | Materia más pesada que Cmax | ISW con Cnorm = 20 y Cmax = 26, meta M1 | Pantalla Sin plan, causa ISW28 (30 créditos) |
| T05 | Cuatrimestre sin inscripción | ISW, 23 obligatorias aprobadas, inicio en Ene, meta M1 | Costo 4.0: Estadía (Ene), vacío (May), ISW24 (Sep), ISW25 (Ene) |

### Los 72 escenarios

Cada celda da el costo óptimo y, entre paréntesis, los cuatrimestres. Son 3 mallas × 4 alumnos × 3 metas × 2 perfiles.

| Alumno | M1 regular | M2 regular | M3 regular | M1 medio tiempo | M2 medio tiempo | M3 medio tiempo |
| --- | --- | --- | --- | --- | --- | --- |
| ISW-E1 | 6.4 (6) | 5.0 (5) | 5.0 (5) | 8.5 (7) | 6.0 (6) | 5.0 (5) |
| ISW-E2 | 4.2 (4) | 3.0 (3) | 3.0 (3) | 5.6 (5) | 3.8 (3) | 3.0 (3) |
| ISW-E3 | 5.0 (5) | 4.0 (4) | 6.0 (6) | 6.6 (6) | 4.2 (4) | 6.0 (6) |
| ISW-E4 | 4.0 (4) | 3.0 (3) | 2.0 (2) | 4.7 (4) | 3.0 (3) | 2.0 (2) |
| IRC-E1 | 6.4 (6) | 5.2 (5) | 5.0 (5) | 8.6 (7) | 6.1 (6) | 5.0 (5) |
| IRC-E2 | 4.3 (4) | 3.1 (3) | 3.0 (3) | 5.6 (5) | 4.0 (4) | 3.0 (3) |
| IRC-E3 | 7.0 (7) | 6.0 (6) | 3.0 (3) | 7.6 (7) | 6.0 (6) | 3.0 (3) |
| IRC-E4 | 6.0 (6) | 3.0 (3) | 2.0 (2) | 6.6 (6) | 3.0 (3) | 2.0 (2) |
| ICD-E1 | 6.4 (6) | 5.1 (5) | 5.0 (5) | 8.5 (7) | 6.0 (6) | 5.0 (5) |
| ICD-E2 | 4.3 (4) | 3.0 (3) | 3.0 (3) | 5.6 (5) | 3.9 (3) | 3.0 (3) |
| ICD-E3 | 7.0 (7) | 6.0 (6) | 6.0 (6) | 7.6 (7) | 6.0 (6) | 6.0 (6) |
| ICD-E4 | 4.0 (4) | 3.0 (3) | 2.0 (2) | 4.6 (4) | 3.0 (3) | 2.0 (2) |

### Qué se comprueba en cada prueba

- **Resultado.** El costo coincide con el esperado (diferencia menor a 10⁻⁹) y el número de cuatrimestres es el mismo.
- **Plan válido.** Un verificador independiente del motor revisa prerrequisitos, oferta, Cmax, K y que la Estadía vaya sola, y recalcula el costo sumando c(S).
- **Garantía.** Cada pasada con peso H dio un costo ≤ H · C\*.
- **Propiedades en 200 mallas al azar de 8 a 11 materias.** El costo con poda es igual al costo sin poda, h nunca supera el costo real y h(A) ≤ c(S) + h(A ∪ S) en cada transición.
- **Flujo completo con Playwright.** Ana Ruiz (ISW-E3, meta M1) llega a un plan de costo 5.0 en 5 cuatrimestres. T03 termina en Sin plan. Detener corta la búsqueda. A 390 px de ancho no hay desplazamiento horizontal.

## 7. Plan del experimento (D20)

Se corren cuatro experimentos con el script scripts/experimento.ts, que usa el mismo motor en Node y escribe un CSV por experimento. Entre los cuatro responden cuánto tarda el primer plan, qué tan lejos del óptimo queda cada pasada, cuánto ahorra la poda y qué parámetro decide el egreso.

| Exp. | Pregunta | Escenarios | Métodos | Se mide |
| --- | --- | --- | --- | --- |
| A | ¿Cuánto tarda el primer plan y cuánto el óptimo? | Los 72 | Anytime A* | Por pasada: H, costo, expansiones, generados y tiempo; tiempo al primer plan; costo final contra el esperado |
| B | ¿Anytime A* conviene frente a las alternativas? | Los 24 con meta M1 (3 mallas × 4 alumnos × 2 perfiles) | Anytime A*, A*, Weighted A* con H = 2 y Costo Uniforme | Costo, expansiones, tiempo total, tiempo al primer plan y máximo de estados en memoria |
| C | ¿Cuánto ahorran las reglas D06 a D08? | E1 y E3 con meta M1 y medio tiempo, en las 3 mallas | A* con y sin las reglas | Expansiones y tiempo; el costo debe ser igual |
| D | ¿Qué parámetro decide cuándo egresa el alumno? | ISW-E1, meta M1 | A* | Costo, cuatrimestres y créditos de sobrecarga por cada valor |

### Protocolo

- Cada corrida se repite 5 veces y se reporta la mediana del tiempo. Las expansiones y los costos no cambian entre repeticiones.
- Una corrida se corta a los 60 s y se registra como «no terminó»; Costo Uniforme puede caer aquí y eso también es un resultado.
- Se anota el equipo: procesador, memoria y versión de Node.
- Se entregan los CSV en resultados/ y dos gráficas en el reporte: el costo contra el tiempo de las pasadas de Anytime en ISW-E1 con medio tiempo, y las expansiones por método en el experimento B.

### Valores de referencia del experimento D

Calculados con referencia.py; el script debe reproducirlos.

| Cambio sobre el perfil regular | Costo óptimo | Cuatrimestres | Créditos de sobrecarga |
| --- | --- | --- | --- |
| Ninguno (β = 0.1, Cnorm = 30, Cmax = 36, K = 7) | 6.4 | 6 | 4 |
| β = 0.05 | 6.2 | 6 | 4 |
| β = 0.2 | 6.8 | 6 | 4 |
| β = 0.5 | 7.0 | 7 | 0 |
| Cnorm = 24 | 8.5 | 7 | 15 |
| Cnorm = 27 | 7.4 | 7 | 4 |
| Cnorm = 33 | 6.0 | 6 | 0 |
| Cmax = 30 | 7.0 | 7 | 0 |
| Cmax = 33 | 6.4 | 6 | 4 |
| Cmax = 40 | 6.4 | 6 | 4 |
| K = 5 o 6 | 6.4 | 6 | 4 |

Lo que ya se ve: la carga normal es la que más mueve el egreso, subir la carga máxima arriba de 33 no adelanta nada y β = 0.5 hace que convenga un séptimo cuatrimestre antes que cargar de más.

## 8. Equipo, calendario y entrega (D21)

Luis desarrolla todo el proyecto. El compañero de equipo no programa: usa esta documentación para entender cómo funciona y prepara con Luis el reporte y la presentación. La entrega es el viernes 4 de diciembre de 2026.

| Quién | Responsable de |
| --- | --- |
| Luis | Motor, interfaz, datos, pruebas y experimento |
| Compañero | Leer la documentación, revisar la demostración y preparar con Luis el reporte y la presentación |

**Por qué así.** Un solo responsable del código evita repartir el trabajo y coordinar dos ramas. El calendario separa interfaz y motor en dos carriles porque avanzan en paralelo dentro de cada semana.

**Reglas de trabajo.**

- Commits pequeños en main, cada uno con las pruebas en verde.
- Si el contrato del motor cambia, se actualiza primero este documento y después el código.
- Al cerrar cada hito, Luis le muestra el avance al compañero.

### Calendario

| Semana | Interfaz y datos | Motor y pruebas | Hito |
| --- | --- | --- | --- |
| 3 a 8 nov | Arranque, Inicio y Plan de estudios | Validación, heurística y sucesores | |
| 9 a 15 nov | Historial, Meta y store | Weighted A*, Anytime y 77 casos | 15 nov: el motor pasa los 77 casos |
| 17 a 22 nov | Worker, Búsqueda y Resultado | A*, Costo Uniforme y script | 22 nov: flujo completo de Ana Ruiz |
| 23 a 29 nov | Detalle, Análisis, Sin plan y celular | Experimentos A a D y Playwright | 29 nov: funciones congeladas |
| 30 nov a 4 dic | Reporte y presentación (con el compañero) | Reporte y presentación (con el compañero) | 2 dic ensayo, 3 dic v1.0, 4 dic entrega |

El lunes 16 de noviembre es día inhábil, por eso la tercera semana empieza el martes 17. Los tres primeros hitos cierran en domingo y se revisan en la reunión siguiente.

### Qué se entrega

1. El repositorio con la etiqueta v1.0 y CI en verde.
2. La URL de Vercel con las 10 pantallas.
3. El reporte: los 7 puntos del proyecto, este registro de decisiones, los resultados de los cuatro experimentos con sus dos gráficas y las conclusiones.
4. Una presentación de 10 minutos con demostración en vivo del flujo de Ana Ruiz y del caso Sin plan.

El proyecto se considera terminado cuando el motor pasa los 77 casos, las pruebas de Playwright pasan y los CSV del experimento están en el repositorio.
