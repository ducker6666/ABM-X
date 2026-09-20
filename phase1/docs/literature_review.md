# Revisión de alcance para la Fase 1

## Estado y límite

Esta revisión de alcance fundamenta las decisiones iniciales; no se presenta
como revisión sistemática exhaustiva ni como prueba definitiva de novedad. Las
búsquedas se realizaron y actualizaron el 20 de septiembre de 2026. Las cadenas
y fuentes consultadas están en `references/search_log.csv`.

Antes de enviar el artículo deberá registrarse un protocolo con bases de datos,
periodo, idiomas, criterios de inclusión, deduplicación, cribado por dos
revisores cuando sea posible y diagrama PRISMA.

## Criterios utilizados

Se priorizaron:

- fuentes primarias;
- formulaciones matemáticas explícitas;
- trabajos sobre confianza limitada y medición de polarización;
- estándares de descripción y evaluación de ABM;
- estudios recientes que delimitan posibles extensiones multidimensionales.

Se excluyeron blogs, explicaciones sin fuente primaria y mecanismos que no son
necesarios para la pregunta de Fase 1.

## 1. Modelo base

Hegselmann y Krause (2002) estudian modelos continuos de formación de opinión,
incluyendo una versión no lineal de confianza limitada. En la forma utilizada
en Fase 1, cada agente promedia simultáneamente las opiniones que se encuentran
dentro de su cota de confianza. La literatura distingue esta actualización
síncrona del modelo Deffuant–Weisbuch, basado en encuentros pareados y
secuenciales.

La regla HK es suficiente para producir consenso o varios conglomerados según
la distribución inicial y `epsilon`. Estos comportamientos son antecedentes
conocidos y no constituyen la novedad del proyecto.

La revisión “Bounded confidence opinion dynamics: A survey” de Bernardo et al.
(2024) confirma la amplitud actual de esta familia. Se utiliza para localizar
trabajos, pero la ecuación implementada se contrasta con la fuente HK primaria.

## 2. Polarización no es una propiedad única

Bramson et al. (2016) distinguen nueve sentidos de polarización. Su argumento
central para esta fase es metodológico: separación, dispersión, número de
grupos, cobertura y otras propiedades no deben confundirse.

Adams, White y Araujo (2022) desarrollan cuatro medidas matemáticas basadas en
redes y distribuciones y las prueban con simulaciones. El trabajo muestra que
diferentes medidas aportan información sobre aspectos distintos y respalda la
decisión de no interpretar una única cifra de manera aislada.

## 3. Familia difusa JDJ

Guevara et al. (2020) proponen una familia de medidas de riesgo de polarización
mediante funciones de pertenencia difusa, operadores de solapamiento y
agrupación. El artículo estudia una variable bipolar unidimensional y una escala
Likert de cinco posiciones.

La publicación no define una única implementación denominada simplemente
“JDJ”: existen elecciones de función de pertenencia y operadores. Por ello la
Fase 1 identifica la variante como `JDJ_Pro`, con pertenencia triangular y
solapamiento producto. La transformación de la escala 1–5 a `[0,1]` conserva
las pertenencias lineales. La posterior multiplicación por cuatro se documenta
como normalización del proyecto.

Una consecuencia algebraica es que la variante producto depende de la media:
`JDJ_Pro=(1-mean(x))mean(x)`. Esto motiva la pregunta de investigación, porque
distribuciones muy diferentes pueden compartir el mismo valor.

## 4. Dimensionalidad y distancia

Li, Luo y Chu (publicación disponible en SIAM con DOI
`10.1137/25M1730818`) extienden HK y Deffuant–Weisbuch a opiniones
multidimensionales con funciones de discordancia ponderadas por temas. El
artículo confirma que la selección de una distancia multidimensional es una
decisión sustantiva y puede cambiar transitorios y estados estacionarios.

Por esta razón la Fase 1 permanece en una dimensión. Una extensión a dos o más
temas debe formular una pregunta propia, justificar pesos y geometría y
compararse con esta literatura; no será un simple cambio gráfico.

## 5. Reproducibilidad del ABM

Grimm et al. (2020) presentan la actualización del protocolo ODD para describir
modelos de manera consistente y suficientemente detallada para su
reimplementación. La Fase 1 adopta sus secciones Overview, Design concepts y
Details, además de rationale y evaluación.

La semilla reproducible y la igualdad Python–JavaScript verifican el software,
pero no validan la teoría frente a datos. Esta distinción se conserva en toda la
documentación.

## Vacío de investigación provisional

La combinación potencialmente relevante es una evaluación transparente de la
variante `JDJ_Pro` dentro de escenarios controlados HK, acompañada por métricas
que distinguen forma, dispersión y número de grupos, y por un simulador cuyo
código coincide con la especificación publicada.

Este vacío es provisional. La búsqueda realizada no basta para afirmar que no
exista ningún estudio equivalente. La contribución definitiva deberá fijarse
después del cribado sistemático y antes de ejecutar el análisis confirmatorio.

## Consecuencias para Fase 1

1. reproducir HK sin mecanismos añadidos;
2. usar una dimensión;
3. identificar exactamente la variante JDJ;
4. no usar JDJ como fuerza;
5. comparar indicadores y distribuciones completas;
6. etiquetar condiciones iniciales como tratamientos;
7. separar verificación computacional de validación empírica.
