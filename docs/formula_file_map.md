# Mapa de fórmulas, código y pruebas — Paper 1

Fecha: 2026-09-20.

| Concepto | Fórmula o decisión | Python | Web | Prueba |
|---|---|---|---|---|
| Estado | $x_i(t)\in[0,1]^2$ | `Paper1Config`, `initialize_opinions` | `initialize` | límites `[0,1]` |
| Distancia | $\sqrt{\Delta x^2+\Delta y^2}$ | `euclidean_distance` | `distance` | caso 3–4–5 = 0.5 |
| Vecindad | $\mathcal N_i=\{j:d_E(i,j)\le\varepsilon\}$ | `step` | `step` | agentes aislados/conectados |
| Señal oída | $I_{iA}=1[d_E(x_i,R_A)\le\varepsilon]$ | `step` | `step` | señal fuera de ε no influye |
| Actualización | promedio HK con $m_AR_A,m_BR_B$ | `step` | `step` | ejemplo `(0.175, 0.2)` |
| Sincronía | lectura de `old`, escritura en `new` | `step` | `step` | cadena `[0,.4,.8]→[.2,.4,.6]` |
| Dispersión | media de $\|x_i-\bar x\|^2$ | `mean_squared_dispersion` | `dispersion` | extremos > centro |
| Clusters | componentes conexas con umbral \(\delta_c\) | `connected_components` | `connectedComponents` | dos componentes conocidas |
| Eje A–B | proyección escalar recortada | `axis_projection` | `axisProjection` | A=0, centro=.5, B=1 |
| JDJ-Pro | $2E[\max(\mu_A(i)\mu_B(j),\mu_B(i)\mu_A(j))]$ | `jdj_product_axis` | `jdjProductAxis` | extremos 50/50=1; centro=.5 |
| Resumen | seguidores, RMSD y salidas anteriores | `summarize` | `summarize` | seguidores A/B conocidos |

## Regla de mantenimiento

Un cambio en la ecuación exige modificar conjuntamente:

1. `src/paper1_model.py`.
2. `web/model.js`.
3. `web/formula.html`.
4. `tests/test_paper1_model.py` y `web/verification.js`.
5. Este mapa y el protocolo ODD.

`web/app.js` dibuja y controla la interfaz; no puede introducir una dinámica distinta.
