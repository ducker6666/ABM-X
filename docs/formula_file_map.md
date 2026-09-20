# Mapa de formulas y ficheros

Fecha: 2026-06-22.

Este documento indica donde se implementa cada formula del simulador web. La fuente ejecutable es `project/web/app.js`; `project/web/formula.html` es la leyenda matematica explicativa; `project/web/verification.js` contiene pruebas reproducibles.

| Componente | Formula / operacion | Fichero ejecutable | Funcion o bloque | Documentacion |
|---|---|---|---|---|
| Parametros y escala de controles | Controles 0-1 y conteos reales | `project/web/app.js` | `PARAMS`, `cfg()` | `project/web/formula.html`, seccion "Efecto de las Variables" |
| Estado de agentes | \(x_i(t)=(x_i,y_i)\in[0,1]^2\), `eps`, `mu`, `alpha`, `lambda` | `project/web/app.js` | `resetModel()` | `project/web/formula.html`, seccion "Estado del agente" |
| Vecindad local | \(\mathcal N_i(t)=\{j:\|x_j-x_i\|\leq\varepsilon_i(t)\}\) | `project/web/app.js` | `step()`, bucle `nearby(...)` | `project/web/formula.html`, secciones "Tolerancia" e "Influencia local" |
| Tolerancia adaptativa | \(\varepsilon_i(t)=clip(\varepsilon_i(0)(1-a_r rad_i)(1-a_m mass_i),0.01,1)\) | `project/web/app.js` | `step()`, actualizacion de `a.eps` | `project/web/formula.html`, seccion "Tolerancia y radio de confianza" |
| Media local HK | \(F_i^{local}=mean_{\mathcal N_i}x_j-x_i\) | `project/web/app.js` | `step()`, variables `localX`, `localY` | `project/web/formula.html`, seccion "Influencia local" |
| Polos permanentes | Pesos gaussianos \(w_A,w_B\), objetivo polar \(T_i^{pole}\), fuerza \(F_i^{poles}\) | `project/web/app.js` | `poleForce()` | `project/web/formula.html`, seccion "Polos permanentes" |
| Eventos y fatiga | \(A_e(t)=2^{-(t-t_e)/h_e}\), \(F_i^{event}\) | `project/web/app.js` | `eventAmp()`, `maybeEvents()`, `step()` | `project/web/formula.html`, seccion "Eventos temporales con fatiga" |
| Reactancia y contraeventos | Repulsion si `side(e) != side(i)`, contraevento en posicion opuesta | `project/web/app.js` | `step()`, bloque de eventos; `maybeEvents()` | `project/web/formula.html`, seccion "Reactancia y contraeventos" |
| Deteccion de clusters | Grupos compactos por semilla densa y centroide local | `project/web/app.js` | `detectClusters()` | `project/web/formula.html`, seccion "Fuerza macroscópica por clusters" |
| Masa de cluster | \(M_k=(|k|/N)^\gamma\) | `project/web/app.js` | `detectClusters()` | `project/web/formula.html`, seccion "Fuerza macroscópica por clusters" |
| Gravedad de clusters | \(F_i^{clusters}\) con radio, suavizado y masa | `project/web/app.js` | `step()`, bloque `clusterX`, `clusterY` | `project/web/formula.html`, seccion "Fuerza macroscópica por clusters" |
| Atraccion polo-masa | \(F_i^{mass-pole}=\kappa_{mp}(0.35+0.65M_k)F^{poles}(C_k)\) | `project/web/app.js` | `step()`, bloque `ownCluster` y `clusterPoleCoupling` | `project/web/formula.html`, seccion "Fuerza macroscópica por clusters" |
| Inmovilidad, susceptibilidad y ruido | Umbral \(\alpha_i\), escala \(\mu_i\), perturbacion \(\xi_i(t)\) | `project/web/app.js` | `step()`, bloque `forceNorm`, `moveX`, `moveY` | `project/web/formula.html`, seccion "Inmovilidad α, susceptibilidad μ y anclaje λ" |
| Frontera | Saturacion \(clip(x_i+\Delta x_i,0,1)\) | `project/web/app.js` | `step()`, `clamp(...)` | `project/web/formula.html`, seccion "Estado del agente" |
| JDJ | Conversion 2D por similitud euclidea normalizada: \(d_{iA}=||x_i-P_A||_2\), \(d_{iB}=||x_i-P_B||_2\), \(\mu_A=1-d_{iA}/\sqrt{2}\), \(\mu_B=1-d_{iB}/\sqrt{2}\). Formula de las imagenes: \(P_{ij}=\max(A_iB_j,B_iA_j)\), \(JDJ=(2/n^2)\sum_{ij}P_{ij}\). Implementacion equivalente por frecuencias: \(2\sum_{kl}M_{kl}Freq_kFreq_l\). | `project/web/app.js` | `poleDistanceMembership()`, `jdjMembership()`, `jdjFromFrequencyTable()`, `jdjFrequencyRows()` | `project/web/formula.html`, seccion "Polarización JDJ" |
| Auditor centro | Activacion por JDJ alto y balance 50/50 sostenido | `project/web/app.js` | `polarizationStats()`, `step()` | `project/web/formula.html`, seccion "Polarización JDJ y rebote al centro" |
| Graficas y capas visuales | Mapas, vectores, trazas y leyenda visual | `project/web/app.js` | `drawMain()`, `drawPole()`, `drawPoleVectors()`, `drawClusterFields()` | `project/web/formula.html`, seccion "Mapa Visual" |
| Pruebas | Casos JDJ, frontera, masa, eventos, polo-masa, ruido | `project/web/verification.js` | `runVerification()` | `project/docs/simulator_compliance.md` |

## Regla para defender el codigo

Cuando se cambie una formula, hay que actualizar en paralelo:

1. `project/web/app.js`: implementacion ejecutable.
2. `project/web/formula.html`: formula y explicacion visible.
3. `project/web/verification.js`: prueba minima si el cambio altera calculos.
4. `project/docs/formula_file_map.md`: este mapa.
5. `project/docs/simulator_compliance.md`: si cambia el cumplimiento 3.0-3.7.
