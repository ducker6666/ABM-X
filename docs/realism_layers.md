# Capas de realismo y trazabilidad

Fecha: 2026-09-20.

## Principio

“Más complejo” no equivale a “más real”. Cada capa responde a una carencia concreta del control, conserva una fuente identificable y se puede desactivar. La plausibilidad de un mecanismo no sustituye su calibración.

## Fase 1 — control HK

Pregunta: ¿qué produce el promedio síncrono de todas las opiniones aceptadas?

- Fuente: Hegselmann–Krause; extensión 2D de Fortunato et al.
- Ventaja: simple, reproducible y analizable.
- Límite: si varios agentes comparten vecindad, calculan el mismo promedio y pueden coincidir exactamente.
- Uso recomendado: Paper 1 y control de ablación.

## Fase 2 — interacción parcial DW

Pregunta: ¿qué cambia si las personas se encuentran por parejas y solo recorren una fracción μ?

\[
x_i'=x_i+\mu(x_j-x_i),\quad x_j'=x_j+\mu(x_i-x_j).
\]

- Fuente: Deffuant et al. (2000).
- Parámetros que deben justificarse: μ y contactos por agente/ronda.
- Adaptación declarada: operación vectorial componente a componente y señales obstinadas incluidas en el muestreo ponderado.

## Fase 3 — anclaje FJ

Pregunta: ¿qué cambia si cada persona conserva parte de su opinión inicial?

\[
x_i(t+1)=g x_i(0)+(1-g)T_i(t).
\]

- Fuente del anclaje: Friedkin–Johnsen (1990).
- Adaptación declarada: `T_i` es el promedio de confianza acotada con señales.
- Consecuencia: con anclas distintas y `g>0`, el consenso exacto deja de ser automático.

## Fase 4 — red

Pregunta: ¿qué cambia si la influencia requiere conexión y proximidad de opinión?

- Fuentes: Watts–Strogatz (generador de demostración); Meng et al. (confianza acotada sobre redes).
- Límite: la red sintética no es una red social observada.
- Requisito empírico: sustituir o comparar la topología con datos reales.

## Fase 5 — señales temporales

Pregunta: ¿qué cambia si una fuente solo está presente en fechas declaradas?

\[
m_k(t)=m_k\mathbf1[s_k\le t<s_k+d_k].
\]

- Antecedente: entradas exógenas dependientes del tiempo en Mirtabatabaei et al. (2012).
- Decisión operacional: intervalo rectangular.
- No incluido: fatiga, decaimiento o reactancia sin medición.

## Fase 6 — calibración

Pregunta: ¿qué configuración se aproxima a un panel observado y predice una ola no usada para ajustar?

- Implementado: carga validada, RMSE individual, distancia de variación total y rejilla de parámetros.
- Pendiente: elegir dominio, instrumento de medición, datos, correspondencia entre tiempo y rondas, separación entrenamiento/prueba e identificabilidad.
- Regla: ningún resultado se considera empírico mientras `data/empirical_panel_template.csv` siga sin observaciones.

## Recomendación editorial

No reunir las seis fases en un único primer paper. Paper 1 debe fijar el control. Los modelos DW y FJ pueden formar una comparación posterior. Red, tiempo y calibración deben avanzar cuando exista un dominio empírico claro.
