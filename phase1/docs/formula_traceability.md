# Matriz de trazabilidad científica y computacional

| Elemento | Procedencia | Estado | Python | JavaScript | Prueba |
|---|---|---|---|---|---|
| Opinión continua en `[0,1]` | HK 2002, cambio de escala habitual | adaptación de unidades | `model.py:_validate_opinions` | `model.js:validateOpinions` | límites del estado |
| Distancia `abs(x_i-x_j)` | métrica 1D usada por HK | reproducción | `model.py:step` | `model.js:step` | ejemplo manual |
| Vecindad `d<=epsilon` | HK 2002 | reproducción | `model.py:step` | `model.js:step` | frontera y auto inclusión |
| Media síncrona de vecinos | HK 2002 | reproducción | `model.py:step` | `model.js:step` | sincronía y consenso |
| `mu_A=1-x`, `mu_B=x` | Guevara et al. 2020, Ec. 7 reescalada de 1–5 a 0–1 | cambio de unidades | `model.py:jdj_product` | `model.js:jdjProduct` | casos conocidos |
| JDJ con producto | Guevara et al. 2020, Ec. 6 con operador producto | variante publicada seleccionada | `model.py:jdj_product` | `model.js:jdjProduct` | suma doble explícita |
| `4*JDJ_Pro` | normalización por el máximo teórico 0.25 | adaptación declarada | `model.py:jdj_product` | `model.js:jdjProduct` | extremos y centro |
| Varianza poblacional | estadística descriptiva estándar | auxiliar | `model.py:summarize` | `model.js:summarize` | finitud y paridad |
| `4*varianza` | normalización por el máximo 0.25 en `[0,1]` | adaptación declarada | `model.py:summarize` | `model.js:summarize` | límites |
| Conteo por huecos `>0.05` | definición operacional del estudio | auxiliar, no teoría social | `model.py:cluster_count` | `model.js:clusterCount` | tres grupos manuales |
| xorshift32 | Marsaglia 2003 | implementación computacional | `model.py:XorShift32` | `model.js:XorShift32` | secuencia de referencia |

## Regla de inclusión

Un futuro mecanismo no entra en el modelo activo hasta disponer de:

1. pregunta de investigación;
2. referencia primaria o evidencia empírica;
3. fórmula inequívoca;
4. explicación no técnica;
5. ejemplo calculado;
6. correspondencia código–ecuación;
7. prueba automatizada;
8. análisis de sensibilidad o ablación.

Cuando una ecuación sea nueva, deberá denominarse hipótesis o propuesta del
proyecto, nunca teoría atribuida a la literatura. La Fase 1 no contiene nuevas
reglas conductuales.
