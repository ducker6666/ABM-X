# Especificación científica 1.0 — Fase 1

## Pregunta

¿Puede una medida difusa de riesgo de polarización distinguir consenso,
fragmentación, extremización y bipolarización cuando se aplica a un modelo
clásico y reproducible de confianza limitada?

La pregunta y su posible novedad se consideran provisionales hasta completar
una revisión sistemática registrada. El modelo no se presenta como predictor de
una sociedad concreta.

## Alcance

La Fase 1 reproduce una versión mínima y homogénea del modelo
Hegselmann–Krause (HK). La única regla que modifica opiniones es la media
síncrona de la vecindad de confianza.

## Entidades, estado y escala

- Entidad: agente individual abstracto.
- Estado: una opinión continua `x_i(t)`.
- Dominio: `x_i(t) ∈ [0, 1]`.
- Tiempo: pasos discretos sin correspondencia automática con días o años.
- Población: cerrada; no hay nacimientos, muertes, entradas ni salidas.

Los extremos representan posiciones opuestas en una sola cuestión bipolar. No
se les asignan etiquetas políticas sin datos y definición sustantiva.

## Distancia

`d(i,j) = |x_i(t)-x_j(t)|`.

En una dimensión coincide con las distancias euclídea y Manhattan. Esta
equivalencia deja de cumplirse en dos o más dimensiones.

## Vecindad de confianza

`N_i(t) = {j : |x_j(t)-x_i(t)| <= epsilon}`.

El propio agente pertenece siempre a su vecindad. `epsilon` es homogéneo,
constante y compartido por toda la población.

## Actualización

`x_i(t+1) = sum_{j in N_i(t)} x_j(t) / |N_i(t)|`.

La actualización es síncrona: todos los valores de `t+1` se calculan desde el
mismo vector de opiniones de `t`. La regla se atribuye a Hegselmann y Krause
(2002).

## Inicialización

Los escenarios son tratamientos experimentales, no afirmaciones empíricas:

| Escenario | Regla |
|---|---|
| Uniforme | todos los agentes se extraen de `U(0,1)` |
| Central | todos se extraen de `U(0.45,0.55)` |
| Bipolar equilibrado | 50 % de `U(0.10,0.30)` y 50 % de `U(0.70,0.90)` |
| Bipolar 70/30 | 70 % y 30 % en las mismas bandas |
| Tres grupos | tercios en `[0.10,0.20]`, `[0.45,0.55]` y `[0.80,0.90]` |

El escenario uniforme es el predeterminado porque no introduce grupos antes de
la interacción. Los restantes sirven para comprobar el comportamiento de las
métricas ante estructuras conocidas.

## Observables

### JDJ producto

Se selecciona una variante concreta de la familia de Guevara et al. (2020):
pertenencias triangulares y solapamiento producto. Tras cambiar la escala
Likert 1–5 por una escala `x ∈ [0,1]`:

`mu_A(x)=1-x`, `mu_B(x)=x`.

`JDJ_Pro = n^-2 sum_i sum_j (1-x_i)x_j = (1-mean(x))mean(x)`.

El valor original está en `[0,0.25]`. También se informa `4*JDJ_Pro` como una
reescala explícita del proyecto. La reescala no añade información y no se
atribuye al artículo original.

Consecuencia conocida: una población 50/50 en los extremos y una población
completamente concentrada en 0.5 obtienen el mismo resultado. Por eso la
métrica se estudia junto a varianza, amplitud y grupos, y no se usa como
diagnóstico único.

### Otros observables

- media poblacional;
- varianza poblacional y `4*varianza`;
- amplitud `max(x)-min(x)`;
- desplazamiento máximo por paso;
- número operativo de grupos, contando huecos consecutivos mayores que 0.05.

El conteo de grupos es una definición operacional para estos experimentos, no
una definición universal de grupo social. Ningún observable realimenta la
dinámica.

## Terminación

La simulación termina al alcanzar el número máximo de pasos o cuando el
desplazamiento máximo es menor o igual a `1e-10`. Esa tolerancia es un criterio
numérico y no representa inmovilidad psicológica.

## Exclusiones deliberadas

No se incluyen redes, polos, medios, eventos, ruido, anclaje, agentes obstinados,
contrarreacción, gravedad de clúster, fatiga, retorno central, aprendizaje ni
adaptación de `epsilon`.

## Interpretación permitida

El modelo permite estudiar consecuencias lógicas de sus supuestos y evaluar
indicadores bajo escenarios controlados. No permite inferir causalidad social
real, predecir elecciones ni estimar niveles de polarización de una población
sin calibración y validación externas.
