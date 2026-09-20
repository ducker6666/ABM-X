# Auditoria forense del codigo

Archivo solicitado no localizado: `modelo_basado_en_agentes (1).py`. Archivo auditado: `/Users/zhenboch/PhD Tesis/Markov Chain/Modelo base agentes.py`.

## Dictamen breve

El codigo implementa una variante basica del modelo de Vicsek de particulas autopropulsadas, no un modelo de polarizacion politica. Las variables de estado son posicion fisica `x_i(t) in [0,L)^2` y angulo de movimiento `theta_i(t) in [0,2pi)`. El indicador macroscopico es alineamiento medio de velocidades, no polarizacion ideologica.

## Tabla linea por linea

| Linea o funcion | Operacion realizada | Significado matematico | Modelo al que se parece | Correcto | Problema o limitacion |
|---|---|---|---|---|---|
| 10-12 | Importa NumPy, matplotlib y animacion | Dependencias numericas y graficas | Simulacion Vicsek | Si | Modelo y visualizacion quedan mezclados |
| 18-23 | Define `n,L,v,r,eta,T` globales | N, tamano del toro, velocidad, radio, ruido y pasos | Vicsek et al. 1995 | Parcial | Parametros globales ocultos; `n` se usa dentro de funcion |
| 25 | `np.random.seed(123)` | Semilla global | Reproducibilidad basica | Parcial | RNG global mutable; no se inyecta semilla por experimento |
| 32 | `x=random(n,2)*L` | Posiciones fisicas uniformes | Vicsek | Si | No son actitudes |
| 35 | `theta=random(n)*2pi` | Direcciones iniciales uniformes | Vicsek | Si | No son opiniones salvo reinterpretacion injustificada |
| 44-54 | Distancia periodica euclidea | `d_ij = ||x_i-x_j - L round((x_i-x_j)/L)||_2` | Vicsek en toro | Si | Distancia fisica, no red social ni distancia actitudinal |
| 57-68 | Parametro de orden | `phi=||(1/N) sum_i (cos theta_i, sin theta_i)||` | Vicsek | Si | Mide alineamiento, no polarizacion |
| 71 | `vicsek_step(x,theta,v,r,eta,L)` | Paso temporal | Vicsek | Parcial | Depende de `n` global en linea 79 |
| 75 | Matriz de distancias | Vecindad metrica fisica all-pairs | Vicsek | Si | Complejidad O(N^2) |
| 77 | `new_theta=zeros_like` | Buffer para actualizacion sincronica | Vicsek | Si | Correcto para evitar aliasing angular |
| 79 | `for i in range(n)` | Itera agentes | Vicsek | No robusto | Si `len(theta)!=n`, error o truncamiento |
| 80 | `neighbors = dist[i] <= r` | Vecinos dentro de radio, incluye al propio agente | Vicsek | Si | Incluirse es usual en Vicsek; no documenta empates |
| 82-83 | Suma senos y cosenos | Media circular sin dividir | Vicsek | Si | No dividir es inocuo para `atan2`; no es media aritmetica |
| 85 | `atan2(sum sin, sum cos)` | Direccion promedio circular | Vicsek | Si | Si suma vectorial es cero, `atan2(0,0)=0` por convencion numerica |
| 87 | Ruido uniforme | `xi_i ~ U[-eta/2, eta/2]` | Vicsek | Si | En unidades radianes; no se explicita |
| 89 | Nueva direccion | `theta_i(t+1)=arg(sum_j e^{i theta_j})+xi_i` | Vicsek | Si | Actualizacion sincronica angular |
| 92-93 | Mueve posicion con `new_theta` | `x_i(t+1)=x_i(t)+v(cos theta_i', sin theta_i')` | Vicsek | Si | Mezcla movimiento fisico con supuesta opinion |
| 96 | `x=x%L` | Frontera periodica | Vicsek | Si | Incoherente para espacio actitudinal `[0,1]^d` |
| 104-113 | Simula T pasos | Guarda historias y orden antes del paso | Vicsek | Si | Memoria O(TN); no exporta datos |
| 119-169 | Grafica y anima | Visualizacion | Vicsek | Si | No hay CLI, pruebas ni separacion modelo-vista |

## Ecuaciones reconstruidas

Para `i=1,...,N`, con `x_i(t) in [0,L)^2` y `theta_i(t) in R`:

`d_ij(t)=||x_i(t)-x_j(t)-L round((x_i(t)-x_j(t))/L)||_2`.

`N_i(t)={j: d_ij(t)<=r}`. Como `d_ii=0`, el agente se incluye si `r>=0`.

`theta_i(t+1)=atan2(sum_{j in N_i(t)} sin theta_j(t), sum_{j in N_i(t)} cos theta_j(t)) + xi_i(t)`, con `xi_i(t) ~ U[-eta/2, eta/2]`.

`x_i(t+1)=(x_i(t)+v(cos theta_i(t+1), sin theta_i(t+1))) mod L`.

Parametro de orden: `phi(t)=||(1/N) sum_i (cos theta_i(t), sin theta_i(t))||`.

## Identificacion explicita

- Variables de estado: `x`, `theta`.
- Parametros: `n`, `L`, `v`, `r`, `eta`, `T`.
- Orden de actualizacion: sincronico para angulos; posiciones actualizadas despues.
- Vecindad: disco de radio `r` en espacio fisico periodico.
- Metrica: euclidea con minima imagen periodica.
- Agregacion: media circular por suma vectorial.
- Ruido: angular uniforme aditivo.
- Fronteras: periodicas.
- Movimiento: velocidad constante.
- Indicador: alineamiento colectivo Vicsek.
- Complejidad: O(TN^2) tiempo; O(TN) memoria para historiales.
- Aleatoriedad: inicializacion y ruido por RNG global NumPy.
- Supuesto implicito: agentes moviles fisicos; no red social fija, no opiniones, no polos, no JDJ.

## Pruebas forenses requeridas

Se implementaron en `tests/test_vicsek.py`. Resultados esperados: agente aislado conserva direccion con ruido cero; angulos 1 y 359 grados promedian a 0 grados; bordes opuestos son vecinos por toro; radio cero solo incluye self si posiciones distintas; alineamiento total produce `phi=1`; desorden uniforme cardinal produce `phi=0`; rotacion global conserva `phi`; modulo de desplazamiento es `v`.

## Fallos principales

1. No modela polarizacion politica: modela alineamiento de particulas.
2. Usa distancia fisica periodica, no distancia actitudinal ni red social.
3. El parametro de orden Vicsek no distingue consenso moderado, consenso extremo, bipolarizacion ni fragmentacion.
4. Depende de variable global `n`.
5. No tiene validacion de parametros ni CLI.
6. Las fronteras periodicas son fisicamente naturales, pero socialmente dudosas: opinion 0 y opinion 1 quedan vecinas.
