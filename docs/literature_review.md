# Revisión focalizada de literatura — Paper 1

Fecha: 2026-09-20.

## Alcance y cautela

Esta es una revisión focalizada y reproducible para justificar el modelo; no sustituye una revisión sistemática PRISMA. Por ello no se afirma que la combinación sea absolutamente nueva. Las consultas están registradas en `references/search_log.csv` y las referencias completas en `references/references.bib`.

## Cadena de evidencia usada

| Pieza del modelo | Fuente primaria | Qué permite afirmar |
|---|---|---|
| Promedio síncrono bajo confianza acotada | Hegselmann & Krause (2002) | La vecindad se define por cercanía y los agentes promedian a quienes aceptan. |
| Opiniones bidimensionales y rango circular | Fortunato et al. (2005) | HK puede estudiarse con vectores 2D y distancia euclídea/círculos de confianza. |
| Señal fija con intensidad | Hegselmann & Krause (2015) | Una señal constante es oída dentro de ε y cuenta varias veces en el promedio. |
| Dos grupos competidores | Glass & Glass (2021) | Dos grupos obstinados pueden competir; su tamaño puede representar peso/reputación. |
| Medida JDJ | Guevara et al. (2020) | El riesgo de bipolarización puede medirse con pertenencias difusas y operadores producto/máximo. |

## Decisiones derivadas

### Distancia

Se usa distancia euclídea porque el antecedente vectorial estudia rangos circulares. Manhattan sería otra geometría y produciría una vecindad distinta; no se mezclan ambas.

### Señales

Las señales usan el mismo \(\varepsilon\) que los agentes. No se añade un radio polar separado, una fuerza gaussiana ni una velocidad de atracción. Así se conserva la formulación publicada de señales constantes.

### Inicialización

La distribución uniforme es el caso principal porque Fortunato et al. la usa y porque no impone polarización inicial. Los escenarios central y de dos grupos solo son análisis de contraste.

### JDJ

Guevara et al. formulan el ejemplo aplicado sobre una escala ordinal bipolar 1D y señalan la extensión multidimensional como trabajo futuro. La transformación actual mu=1−d/sqrt(2) usa distancias euclídeas a polos fijos, por especificación del simulador. No se atribuye esta geometría 2D como fórmula literal del artículo. El JDJ por proyección anteriormente utilizado queda obsoleto. Referencia primaria: https://pmc.ncbi.nlm.nih.gov/articles/PMC7274663/. Los scripts locales de Markov contienen también un prototipo que suma productos, distinto del máximo solicitado; no se reutiliza como implementación vigente.

## Literatura reservada para fases posteriores

- Eventos exógenos/temporales: requieren una función temporal defendible y se reservan para el Paper 2.
- Redes: Meng, Van Gorder & Porter (2018) y trabajos relacionados muestran que la topología importa; añadirla ahora mezclaría dos preguntas.
- Confianza adaptativa: Kan, Feng & Porter (2023) ofrece un antecedente, pero se reserva para una extensión aislada.
- Interacciones de orden superior: Hickok et al. (2022) aporta una vía formal distinta de la antigua “gravedad de clusters”.

## Hueco de investigación provisional

La formulación prudente es: **análisis reproducible de dos señales constantes competidoras en un espacio HK bidimensional, junto con una comparación explícita de medidas de resultado**. Esta frase describe el trabajo sin prometer novedad absoluta. El hueco debe confirmarse con búsquedas sistemáticas en Scopus/Web of Science u otra base institucional antes del envío.
