# ABM X — Paper 1 y laboratorio por fases

Simulador bidimensional de opiniones con mecanismos separados, citados y comprobables. El Paper 1 conserva un control mínimo; el laboratorio permite comparar extensiones sin mezclarlas ni llamarlas evidencia empírica.

## Por qué los puntos pueden quedar como uno

En HK, dos agentes que escuchan exactamente al mismo conjunto calculan exactamente el mismo promedio. Siguen siendo dos agentes, pero ocupan la misma coordenada y el lienzo los superpone. Es una consecuencia del modelo, no un fallo gráfico.

La vista predeterminada es ahora la **Fase 4 (FJ + red)**: cada agente conserva 85 % de su opinión inicial y solo escucha a contactos conectados que además están dentro de ε. Produce movimiento más limitado y desacuerdo persistente sin añadir ruido, repulsión ni una “fuerza social” inventada. Esto es más plausible como mecanismo, pero no se denomina realista empíricamente hasta calibrarlo.

## Decisión científica

El modelo confirmatorio del primer paper contiene únicamente:

1. Opiniones \(x_i(t)\in[0,1]^2\).
2. Distancia euclídea.
3. Promedio síncrono de Hegselmann–Krause dentro de un límite de confianza \(\varepsilon\).
4. Dos señales constantes con pesos \(m_A\) y \(m_B\), siguiendo el modelo de señales/grupos obstinados.

No están activos la gravedad de clusters, el rebote al centro, la fatiga, la reactancia, los contraeventos, el ruido ni la tolerancia adaptativa. Esas ideas pertenecen al borrador histórico y no al Paper 1.

## Fases implementadas

| Fase | Mecanismo | Fuente/estatus |
|---|---|---|
| 1 | HK 2D + señales constantes | Control del Paper 1; HK, Fortunato, Hegselmann–Krause, Glass–Glass |
| 2 | Contactos parciales Deffuant–Weisbuch | Regla DW publicada; extensión vectorial y muestreo de señales declarados |
| 3 | Anclaje a la opinión inicial | Núcleo Friedkin–Johnsen publicado; composición con confianza acotada declarada |
| 4 | FJ + red social | Confianza acotada en red; Watts–Strogatz sintética solo para demostración |
| 5 | Red + señales por intervalos | Entradas exógenas variables; ventana rectangular declarada |
| 6 | Comparación con panel real | Tubería lista; sin datos no hay calibración ni validación que afirmar |

El selector web ejecuta una fase cada vez. Que todas estén programadas no significa que deban entrar juntas en el Paper 1.

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

- `src/paper1_model.py`: control Python del Paper 1.
- `src/phased_model.py`: DW, FJ, red y tiempo, con fórmulas en comentarios.
- `src/calibration.py`: RMSE individual y variación total de distribuciones observadas.
- `web/model.js`: la misma regla para el simulador web, separada del dibujo.
- `web/app.js`: interfaz y representación visual; no contiene una segunda teoría.
- `tests/test_paper1_model.py`: casos matemáticos mínimos.
- `web/verification.js`: verificación independiente del motor JavaScript.
- `data/paper1_config.yaml`: protocolo propuesto del experimento.
- `experiments/run_paper1.py`: ejecución reproducible de condiciones y semillas.
- `experiments/calibrate_phases.py`: rejilla de ajuste que exige un CSV real.
- `data/empirical_panel_template.csv`: cabecera esperada, sin observaciones ficticias.

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

Para calibrar una fase con un panel real:

```bash
python experiments/calibrate_phases.py datos.csv --phase network --steps 40
```

El CSV necesita `agent_id,time,x,y`. `--steps` no se infiere de la fecha: debe justificar cuántas rondas del modelo representan el intervalo observado. El resultado es ajuste dentro de muestra, no validación fuera de muestra.

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

## Secuencia de investigación propuesta

1. Paper 1: HK bidimensional con dos señales constantes, pequeño y reproducible.
2. Paper 2: comparar interacción parcial DW y anclaje FJ como explicaciones de persistencia.
3. Paper 3: red y señales temporales vinculadas a observaciones.
4. Tesis: calibración, comparación de modelos y validación fuera de muestra.

Cada paper debe preregistrar su comparación, ejecutar réplicas y conservar un control. La interfaz es una herramienta didáctica; no sustituye el experimento ni los datos.

## Referencias centrales

- Hegselmann & Krause (2002), modelo de confianza acotada HK.
- Fortunato et al. (2005), opiniones vectoriales bidimensionales.
- Hegselmann & Krause (2015), señales constantes.
- Glass & Glass (2021), dos grupos obstinados competidores.
- Guevara et al. (2020), medida difusa JDJ para riesgo de bipolarización.
- Deffuant et al. (2000), contactos parciales.
- Friedkin & Johnsen (1990), anclaje a opiniones iniciales.
- Watts & Strogatz (1998) y Meng et al. (2018), redes.
- Mirtabatabaei et al. (2012), entradas exógenas variables.
- Gestefeld & Lorenz (2023), calibración empírica.

Los DOI, URLs y metadatos completos están en `references/references.bib`.
