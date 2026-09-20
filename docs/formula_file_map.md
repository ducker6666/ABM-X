# Mapa histórico de fórmulas, código y pruebas — modelo de control

> Este mapa conserva la trazabilidad del modelo HK de control. La composición
> integrada visible en la web se documenta en `docs/integrated_model_contract.md`
> y `web/formula.html`.

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

## Módulos posteriores, separados del Paper 1

| Fase | Fórmula o decisión | Python | Web | Prueba |
|---|---|---|---|---|
| 2 · DW | $x_i'=x_i+\mu(x_j-x_i)$ | `deffuant_pair_update` | `deffuantPairUpdate` | 0 y .2, μ=.1 → .02 y .18 |
| 3 · FJ | $g x_i(0)+(1-g)T_i(t)$ | `friedkin_johnsen_step` | `friedkinJohnsenStep` | g=1 conserva ancla |
| 4 · red | filtro por arista y distancia | `_bounded_target` | `boundedTarget` | red simétrica sin lazos |
| 4 · Watts–Strogatz | anillo k + reconexión β | `build_small_world_network` | `buildSmallWorldNetwork` | semilla reproducible |
| 5 · intervalo | $1[s\le t<s+d]$ | `active_interval` | `activeInterval` | fronteras exactas |
| 6 · RMSE | error euclídeo individual | `individual_rmse` | — | identidad = 0 |
| 6 · TVD | $.5\sum_b|p_b-q_b|$ | `histogram_tvd` | — | histogramas disjuntos = 1 |

## Regla de mantenimiento

Un cambio en la ecuación exige modificar conjuntamente:

1. El motor Python pertinente (`paper1_model.py`, `phased_model.py` o `calibration.py`).
2. `web/model.js` si el mecanismo se muestra en el navegador.
3. `web/formula.html`.
4. La prueba Python pertinente y `web/verification.js`.
5. Este mapa; el protocolo ODD solo si cambia el Paper 1.

`web/app.js` dibuja y controla la interfaz; no puede introducir una dinámica distinta.
