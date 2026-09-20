# Protocolo ODD — Paper 1

Fecha de revisión: 2026-09-20.

## 1. Overview

### 1.1 Propósito

Estudiar cómo el límite de confianza, la posición y la intensidad de dos señales constantes competidoras afectan al consenso, el seguimiento y la fragmentación en un espacio de opinión bidimensional.

### 1.2 Entidades, variables de estado y escalas

- **Agentes normales:** \(N\) agentes con opinión \(x_i(t)\in[0,1]^2\).
- **Señales constantes:** dos posiciones fijas \(R_A,R_B\in[0,1]^2\) con pesos \(m_A,m_B\ge0\).
- **Tiempo:** discreto, \(t=0,1,2,\ldots\).
- **Interacción:** población completamente mezclada; no hay una red social en el Paper 1.

### 1.3 Procesos y orden

En cada paso:

1. Se guarda una copia completa del estado en \(t\).
2. Para cada agente se localizan agentes y señales dentro de la distancia euclídea \(\varepsilon\).
3. Se calcula el promedio ponderado definido por la ecuación del modelo.
4. Todas las nuevas posiciones se asignan simultáneamente.
5. Se calculan medidas descriptivas que no realimentan la dinámica.

## 2. Design concepts

- **Principios básicos:** confianza acotada HK y señales constantes publicadas.
- **Emergencia:** consenso y clusters aparecen por promedios locales; no existe una fuerza de cluster.
- **Adaptación:** ninguna en el Paper 1. \(\varepsilon\) es constante.
- **Objetivos individuales:** no se modelizan.
- **Aprendizaje:** cambio de opinión por promedio local.
- **Predicción:** no se atribuye capacidad predictiva empírica sin calibración.
- **Percepción:** un agente percibe opiniones y señales dentro de \(\varepsilon\).
- **Interacción:** indirecta mediante la media síncrona.
- **Estocasticidad:** solo la condición inicial, controlada por semilla.
- **Colectivos:** los clusters son componentes conexas calculadas después de cada paso; no son agentes colectivos.
- **Observación:** dispersión, clusters, seguidores, RMSD y JDJ proyectado exploratorio.

## 3. Details

### 3.1 Inicialización

La condición principal es uniforme: \(x_i(0)\sim U([0,1]^2)\). Las condiciones central y bimodal son contrastes explícitos, no valores por defecto ocultos.

### 3.2 Datos de entrada

El experimento recibe `data/paper1_config.yaml`: población, semillas, posiciones de señales, pesos, valores de \(\varepsilon\), límite temporal y criterio de convergencia.

### 3.3 Submodelos

La dinámica completa es:

\[
x_i(t+1)=
\frac{\sum_{j\in\mathcal N_i(t)}x_j(t)+I_{iA}m_AR_A+I_{iB}m_BR_B}
{|\mathcal N_i(t)|+I_{iA}m_A+I_{iB}m_B}.
\]

No existen otros submodelos activos. Las definiciones de salida están en `docs/mathematical_model.md` y `web/formula.html`.

## 4. Verificación, calibración y validación

- **Verificación:** pruebas unitarias, casos límite, comparación del ejemplo manual y equivalencia conceptual Python/JavaScript.
- **Calibración:** no realizada todavía.
- **Validación empírica:** no realizada todavía.
- **Validación de patrones:** se debe comprobar primero el caso HK sin señales contra patrones cualitativos publicados.
