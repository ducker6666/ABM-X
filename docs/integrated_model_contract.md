# Contrato del modelo integrado activo

Fecha: 2026-09-20.

Este documento describe la implementación que aparece en `web/index.html`,
`web/model.js` y `src/integrated_model.py`. La composición completa es una
hipótesis computacional auditable; no se presenta como una teoría publicada en
su totalidad.

## 1. Entrada A/B

Las columnas `A` y `B` son grados de pertenencia en `[0,1]`, no distancias:

\[
x_i(0)=(A_i,B_i).
\]

Los polos son `R_A=(1,0)` y `R_B=(0,1)`. Después de colocar al agente, las
distancias son euclídeas:

\[
d_{iA}=\sqrt{(A_i-1)^2+B_i^2},\qquad
d_{iB}=\sqrt{A_i^2+(B_i-1)^2}.
\]

La entrada contractual solo requiere A y B normalizados; una columna `pos`, si
existe, no interviene en el motor. Como comprobación del archivo aportado
`elecciones_23_X_grados_pertenencia.csv`: contiene 950 filas, doce pares A/B
distintos, valores entre 0 y 1 y máximo `|A+B-1|=4.44e-16`. Esa última relación
describe ese conjunto de datos y no se exige a futuros archivos.

La población sintética sortea A y B de forma independiente y crea el punto
`(A,B)`. Es un escenario nulo reproducible que ocupa el plano; no constituye
una distribución empírica. El lector CSV, en cambio, conserva cada par A/B sin
añadir dispersión y respeta campos entre comillas, comas y saltos de línea.

## 2. Escalas visibles

- Coordenadas A/B: `[0,1]`, porque esa es la escala observada.
- Intensidad de polos y eventos: peso relativo `0–10`.
- Área, tolerancia y homofilia: nivel `0–10`; distancia interna `nivel/10`.
- Fuerza social y recentrado: nivel `0–10`; tasa interna por ronda `nivel/100`.
- Probabilidades y proporciones: porcentaje visible; valor interno `%/100`.

Compartir una regla visual no convierte peso, distancia y probabilidad en la
misma magnitud. La conversión de cada familia se conserva explícita.

## 3. Evento y contraevento

Para un evento `E=(x_E,y_E)`, el contraevento es la reflexión respecto al
centro `M=(0.5,0.5)`:

\[
C=2M-E=(1-x_E,1-y_E).
\]

Evento y contraevento comparten inicio, intensidad, alcance y duración. Esta
simetría es un escenario controlado. En una aplicación empírica deberá
contrastarse o sustituirse por atributos observados.

El modo aleatorio sortea, mediante la semilla, posición, inicio, intensidad,
área y duración. El modo manual recibe posición y ronda de inicio del usuario.
El contraevento nunca se coloca a ojo: siempre se calcula con la ecuación
anterior.

## 4. Actualización final

Para un agente móvil que no realiza un salto de ruido:

\[
\Delta_i(t)=
\frac{\eta\,[G_i(t)+P_i(t)+E_i(t)]+R_i(t)}{k_i(t)},
\]

\[
x_i(t+1)=\operatorname{clip}_{[0,1]^2}[x_i(t)+\Delta_i(t)].
\]

- `G_i`: promedio firmado de los contactos de red.
- `P_i`: desplazamiento ponderado de los polos persistentes.
- `E_i`: desplazamiento ponderado de eventos activos.
- `R_i`: recentrado si el auditor está activo; cero en otro caso.
- `k_i=1+s r_i`: resistencia por extremidad.

Polos y eventos se calculan por separado con la misma regla de fuente:

\[
S_i=
\frac{\sum_k w_k\,1[d(x_i,R_k)\le\rho_k]\,(R_k-x_i)}
{1+\sum_k w_k\,1[d(x_i,R_k)\le\rho_k]}.
\]

El `1` del denominador representa el peso de la posición propia. Si el agente
es inmóvil, no cambia. Si el sorteo de ruido tiene éxito, esa ronda se sustituye
por un salto local acotado. En otro caso se aplica la ecuación integrada.

## 5. JDJ proyectado

El JDJ activo no usa directamente la distancia euclídea a los polos. Proyecta
la posición actual sobre el eje A--B:

\[
s_i=\operatorname{clip}_{[0,1]}
\frac{(x_i-R_A)\cdot(R_B-R_A)}{\|R_B-R_A\|^2},\quad
\mu_A(i)=1-s_i,\quad \mu_B(i)=s_i.
\]

Después calcula los `N²` pares ordenados, incluidos los pares de una persona
consigo misma:

\[
h_{ij}=\max[\mu_A(i)\mu_B(j),\mu_B(i)\mu_A(j)],\qquad
JDJ_{proj}=\operatorname{clip}_{[0,1]}\frac{2\sum_{ij}h_{ij}}{N^2}.
\]

Producto y máximo siguen a Guevara et al. (2020). La proyección 2D y el factor
2 son adaptaciones declaradas. El motor expone `sum(h_ij)` y `N²` para que el
valor mostrado pueda recalcularse.

## 6. Correspondencia con el código

| Regla | JavaScript | Python | Prueba |
|---|---|---|---|
| A/B → posición | `positionFromMemberships` | `position_from_memberships` | ejemplo `6/7,1/7` |
| Lector CSV | `parseMembershipCsv` | `load_membership_csv` | texto con coma y salto de línea |
| Contraevento | `oppositePosition` | `opposite_position` | `(0.8,0.3)→(0.2,0.7)` |
| Fuente ponderada | `weightedSourceDisplacement` | `weighted_source_displacement` | intensidad alta mueve más |
| Actualización | `integratedStep` | `step` | polos, eventos, auditor e inmovilidad |
| JDJ y sumandos | `jdjProductAxisDetails` | `jdj_axis_details` | `sum(h)=1.60`, `N²=4`, JDJ `0.80` |

Comandos de verificación:

```bash
python -m pytest
node web/verification.js
```
