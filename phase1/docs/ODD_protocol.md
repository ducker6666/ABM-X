# Protocolo ODD 2020 — Fase 1

Versión 1.0. Estructura basada en Grimm et al. (2020). Esta descripción se
refiere exclusivamente al código de `phase1/`.

## 1. Overview

### 1.1 Purpose and patterns

El propósito es evaluar cómo se comportan varias medidas de polarización en
configuraciones conocidas generadas por un modelo clásico de confianza
limitada. Los patrones de interés son consenso, persistencia de varios grupos,
extensión de la distribución y discrepancias entre indicadores.

No se pretende predecir una población real ni proponer una nueva teoría de
formación de opiniones.

### 1.2 Entities, state variables and scales

La única entidad dinámica es el agente. Cada agente posee:

- un identificador implícito por posición en el vector;
- una opinión `x_i(t) ∈ [0,1]`.

No existen grupos como entidades, red social, espacio geográfico ni agentes
institucionales. Los grupos calculados son observables posteriores.

El tiempo es discreto y adimensional. Un paso representa una ronda abstracta
de consideración simultánea de opiniones.

### 1.3 Process overview and scheduling

1. Se valida la configuración.
2. Se inicializa una población mediante el escenario y la semilla.
3. Se calculan y guardan observables en `t=0`.
4. Para cada paso:
   1. se conserva el vector completo de opiniones de `t`;
   2. para cada agente se identifica su vecindad de confianza;
   3. se calcula la media de esa vecindad;
   4. después de calcular todas las medias, se sustituye el vector completo;
   5. se calculan observables;
   6. se comprueba la terminación.

El orden de los agentes no altera el resultado de un paso porque la
actualización es síncrona.

## 2. Design concepts

### 2.1 Basic principles

El único principio conductual implementado es confianza limitada: los agentes
promedian las opiniones que no distan más de `epsilon`. Procede de Hegselmann y
Krause (2002).

### 2.2 Emergence

El número y posición de conglomerados finales emergen de la interacción entre
distribución inicial y `epsilon`. Los escenarios bipolar y de tres grupos ya
contienen estructura inicial y, por ello, no pueden usarse para afirmar que esa
estructura emergió espontáneamente.

### 2.3 Adaptation

No existe. Los agentes no cambian `epsilon` ni eligen estrategias.

### 2.4 Objectives

Los agentes no optimizan una función ni persiguen objetivos.

### 2.5 Learning

No existe aprendizaje.

### 2.6 Prediction

Los agentes no predicen estados futuros.

### 2.7 Sensing

Cada agente tiene acceso exacto a todas las opiniones actuales para comprobar
cuáles están dentro de `epsilon`. No hay error perceptivo ni información local
impuesta por una red.

### 2.8 Interaction

La interacción es indirecta y simultánea mediante la media de la vecindad de
confianza. Todos los vecinos poseen el mismo peso.

### 2.9 Stochasticity

La dinámica después de `t=0` es determinista. La única aleatoriedad aparece en
la inicialización. Se utiliza xorshift32 para reproducibilidad cruzada.

### 2.10 Collectives

No hay colectivos como entidades. El conteo de grupos por huecos es una medida
descriptiva y no interviene en la dinámica.

### 2.11 Observation

En cada paso se registra:

- tiempo;
- media;
- varianza y varianza normalizada;
- amplitud;
- JDJ producto bruto y normalizado;
- número operativo de grupos;
- desplazamiento máximo.

Las opiniones individuales se conservan en el historial Python y se muestran
en la web. Ningún observable realimenta el modelo.

## 3. Details

### 3.1 Initialization

Los cinco escenarios se definen en `model_specification.md`. El escenario
predeterminado es uniforme. La semilla predeterminada es 2026 y debe ser un
entero entre 1 y `2^32-1`.

### 3.2 Input data

La Fase 1 no utiliza datos externos. Todos los estados iniciales son sintéticos.

### 3.3 Submodels

#### Vecindad

`N_i(t)={j: |x_j(t)-x_i(t)|<=epsilon}`.

#### Actualización

`x_i(t+1)=|N_i(t)|^-1 sum_{j in N_i(t)}x_j(t)`.

#### JDJ producto

`JDJ_Pro=n^-2 sum_i sum_j (1-x_i)x_j`.

Se informa además `4*JDJ_Pro` como reescala explícita.

#### Conteo operativo de grupos

Se ordenan las opiniones. Se comienza con un grupo y se suma uno cuando el
hueco entre observaciones consecutivas es mayor que 0.05.

#### Terminación

Se detiene cuando el desplazamiento máximo es menor o igual a `1e-10` o cuando
se alcanza `max_steps`.

## 4. Rationale and evaluation

La simplificación es intencional: cada mecanismo adicional dificultaría
atribuir los resultados. La evaluación descrita en `validation_plan.md`
incluye ejemplos manuales, invariantes, paridad entre lenguajes, múltiples
semillas, sensibilidad y revisión conceptual. No se afirma calibración ni
validación empírica.
