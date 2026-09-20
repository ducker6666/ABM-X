# Modelo matemático activo — Paper 1

## 1. Espacio y distancia

\(x_i(t)\in[0,1]^2\). La distancia es euclídea:

\[
d_E(x_i,x_j)=\sqrt{(x_{i1}-x_{j1})^2+(x_{i2}-x_{j2})^2}.
\]

No se usa distancia Manhattan.

## 2. Vecindad de confianza

\[
\mathcal N_i(t)=\{j:d_E(x_i(t),x_j(t))\le\varepsilon\}.
\]

El conjunto incluye a \(i\). \(\varepsilon\) es apertura: responde “¿a quién escucha?”, no “¿con qué fuerza se mueve?”.

## 3. Señales constantes

Las señales \(R_A,R_B\in[0,1]^2\) permanecen fijas. Sus indicadores de audición son:

\[
I_{ik}(t)=\mathbf1[d_E(x_i(t),R_k)\le\varepsilon],\quad k\in\{A,B\}.
\]

Con pesos \(m_A,m_B\ge0\):

\[
x_i(t+1)=
\frac{\sum_{j\in\mathcal N_i(t)}x_j(t)+I_{iA}m_AR_A+I_{iB}m_BR_B}
{|\mathcal N_i(t)|+I_{iA}m_A+I_{iB}m_B}.
\]

La actualización es síncrona. La regla es un promedio convexo, de modo que mantiene \(x_i(t+1)\in[0,1]^2\).

## 4. Ejemplo

\(x_i=(0.2,0.2)\), vecino \(x_j=(0.3,0.2)\), señal \(R_A=(0.1,0.2)\), \(m_A=2\) y todos a distancia \(\le\varepsilon\):

\[
x_i(t+1)=\frac{(0.2,0.2)+(0.3,0.2)+2(0.1,0.2)}{4}=(0.175,0.2).
\]

## 5. Salidas primarias

Centroide y dispersión:

\[
\bar x=\frac1N\sum_i x_i,\qquad D=\frac1N\sum_i\|x_i-\bar x\|_2^2.
\]

Clusters: componentes conexas del grafo diagnóstico con arista \(i-j\) si \(d_E(x_i,x_j)\le\delta_c\). \(\delta_c\) no entra en la dinámica.

Seguidores de A: \(F_A=\#\{i:d_E(x_i,R_A)\le10^{-3}\}\). RMSD: \(\sqrt{N^{-1}\sum_i d_E(x_i,R_A)^2}\). Análogo para B.

## 6. Diagnóstico JDJ exploratorio

Proyección geométrica:

\[
s_i=clip\left(\frac{(x_i-R_A)\cdot(R_B-R_A)}{\|R_B-R_A\|_2^2},0,1\right).
\]

Pertenencias: \(\mu_A(i)=1-s_i\), \(\mu_B(i)=s_i\). Se conserva el núcleo producto/máximo de JDJ y se aplica una normalización operativa con factor 2 para que una división dura 50/50 entre A y B valga 1:

\[
JDJ=\frac2{N^2}\sum_{i,j}\max\{\mu_A(i)\mu_B(j),\mu_B(i)\mu_A(j)\}.
\]

La proyección y el factor de normalización son decisiones declaradas del proyecto. JDJ no realimenta la dinámica y no es una medida multidimensional validada.

## 7. Fuera del modelo activo

No hay fuerzas, gravedad de clusters, eventos, fatiga, contraeventos, rebote al centro, ruido, anclaje, inmovilidad ni tolerancia adaptativa.
