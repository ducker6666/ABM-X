# ABM X — Paper 1

Simulador bidimensional de opiniones con confianza acotada y dos señales constantes competidoras. Esta rama recupera la identidad visual del modelo original, pero reduce su dinámica a mecanismos que pueden explicarse, citarse y comprobarse.

## Decisión científica

El modelo activo del primer paper contiene únicamente:

1. Opiniones \(x_i(t)\in[0,1]^2\).
2. Distancia euclídea.
3. Promedio síncrono de Hegselmann–Krause dentro de un límite de confianza \(\varepsilon\).
4. Dos señales constantes con pesos \(m_A\) y \(m_B\), siguiendo el modelo de señales/grupos obstinados.

No están activos la gravedad de clusters, el rebote al centro, la fatiga, la reactancia, los contraeventos, el ruido ni la tolerancia adaptativa. Esas ideas pertenecen al borrador histórico y no al Paper 1.

La ecuación completa es:

\[
x_i(t+1)=
\frac{\sum_{j\in\mathcal N_i(t)}x_j(t)+I_{iA}m_AR_A+I_{iB}m_BR_B}
{|\mathcal N_i(t)|+I_{iA}m_A+I_{iB}m_B}.
\]

`I_iA` e `I_iB` valen uno solamente cuando la señal correspondiente está a distancia euclídea \(\varepsilon\) o menos.

## Abrir las tres páginas

Desde la raíz del repositorio:

```bash
python -m http.server 8765 --directory web
```

Después abre [http://localhost:8765/](http://localhost:8765/).

- Página 1: simulador bidimensional.
- Página 2: fórmulas, ejemplos, fuentes y correspondencia con el código.
- Página 3: introducción, pregunta, objetivos, metodología, limitaciones y hoja de ruta del paper.

Para cerrar el servidor, vuelve al Terminal y pulsa `Control + C`.

Si aparece un error 404, comprueba que el comando se ejecuta dentro de la carpeta `project`. También puedes usar una ruta absoluta:

```bash
python -m http.server 8765 --directory "/Users/zhenboch/PhD Tesis/MBA:ABM:Modelo basado en agentes/project/web"
```

## Código que debe poder defenderse

- `src/paper1_model.py`: versión Python de la ecuación, con explicación, fórmulas y ejemplo.
- `web/model.js`: la misma regla para el simulador web, separada del dibujo.
- `web/app.js`: interfaz y representación visual; no contiene una segunda teoría.
- `tests/test_paper1_model.py`: casos matemáticos mínimos.
- `web/verification.js`: verificación independiente del motor JavaScript.
- `data/paper1_config.yaml`: protocolo propuesto del experimento.
- `experiments/run_paper1.py`: ejecución reproducible de condiciones y semillas.

Los ficheros anteriores como `src/final_model.py`, `src/attitudinal_abm.py` y `src/proposed_model.py` se conservan como historial exploratorio. No definen el Paper 1.

## Verificación

```bash
python -m pytest
node web/verification.js
```

Para verificar el flujo experimental con una ejecución pequeña:

```bash
python experiments/run_paper1.py --quick
```

El protocolo completo se ejecuta sin `--quick` y guarda `outputs/paper1_results.csv`. La opción rápida solo comprueba que el flujo funciona; no produce resultados publicables.

## Qué se mediría

- Dispersión bidimensional alrededor del centroide.
- Número de clusters como componentes conexas bajo un umbral declarado.
- Seguidores y distancia RMS a cada señal.
- JDJ-Pro proyectado sobre el eje A–B, únicamente como diagnóstico exploratorio.

El JDJ publicado es bipolar y unidimensional. Aquí la reducción 2D→1D mediante proyección geométrica está etiquetada como adaptación; nunca mueve agentes y nunca debe presentarse como una versión multidimensional validada.

## Paper 1 recomendado

Título de trabajo:

> Señales constantes competidoras en un modelo bidimensional de confianza acotada: consenso, fragmentación y medición de la polarización.

La posible contribución es una extensión bidimensional reproducible, con dos señales competidoras y una comparación transparente de medidas. No se afirma novedad absoluta hasta cerrar una revisión sistemática.

## Próximas fases posibles

1. Señales temporales/eventos con una formulación y datos observables.
2. Red social explícita.
3. Confianza heterogénea o adaptativa basada en una formulación publicada.
4. Calibración y validación empírica como eje de una eventual tesis.

Cada extensión debe añadirse por separado, con ablación contra el modelo base.

## Referencias centrales

- Hegselmann & Krause (2002), modelo de confianza acotada HK.
- Fortunato et al. (2005), opiniones vectoriales bidimensionales.
- Hegselmann & Krause (2015), señales constantes.
- Glass & Glass (2021), dos grupos obstinados competidores.
- Guevara et al. (2020), medida difusa JDJ para riesgo de bipolarización.

Los DOI, URLs y metadatos completos están en `references/references.bib`.
