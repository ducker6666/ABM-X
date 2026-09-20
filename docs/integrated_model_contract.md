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

Auditoría del archivo aportado
`elecciones_23_X_grados_pertenencia.csv`: 950 filas; doce pares A/B distintos;
valores entre 0 y 1; máximo `|A+B-1|=4.44e-16`; y máximo error frente a
`A=(pos+7)/14`, `B=(7-pos)/14` igual a `4.44e-16`. Esos residuos son redondeo
binario, no discrepancias sustantivas.

La población sintética sigue el mismo contrato: sortea A, fija `B=1-A` y crea
el punto `(A,B)`. El lector CSV respeta campos entre comillas, comas y saltos de
línea.

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
\frac{\eta\,[G_i(t)+P_i(t)+E_i(t)]+C_i(t)}{k_i(t)},
\]

\[
x_i(t+1)=\operatorname{clip}_{[0,1]^2}[x_i(t)+\Delta_i(t)].
\]

- `G_i`: promedio firmado de los contactos de red.
- `P_i`: desplazamiento ponderado de los polos persistentes.
- `E_i`: desplazamiento ponderado de eventos activos.
- `C_i`: recentrado si el auditor está activo; cero en otro caso.
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

## 5. Correspondencia con el código

| Regla | JavaScript | Python | Prueba |
|---|---|---|---|
| A/B → posición | `positionFromMemberships` | `position_from_memberships` | ejemplo `6/7,1/7` |
| Lector CSV | `parseMembershipCsv` | `load_membership_csv` | texto con coma y salto de línea |
| Contraevento | `oppositePosition` | `opposite_position` | `(0.8,0.3)→(0.2,0.7)` |
| Fuente ponderada | `weightedSourceDisplacement` | `weighted_source_displacement` | intensidad alta mueve más |
| Actualización | `integratedStep` | `step` | polos, eventos, auditor e inmovilidad |

Comandos de verificación:

```bash
python -m pytest
node web/verification.js
```
