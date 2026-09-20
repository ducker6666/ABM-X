# ABM X

## Revisión de interfaz y preparación científica

Las fórmulas se presentan con tipografía matemática y ejemplos por pasos.
La web funciona sin dependencias de red; solo para regenerar la documentación:
`npm ci && npm run math`. Su fuente LaTeX está en `web/equations.cjs`.
La regeneración usa Node ≥22.12; abrir el simulador no requiere Node.
`node scripts/render_math.cjs --check` detecta documentación renderizada obsoleta.
Los controles continuos tienen paso 0.01 y avisan de cambios pendientes de reinicio.

Consulta la [evaluación para artículo y tesis](docs/research_readiness.md).

### Comprender antes de ampliar

- [Significado de las variables](docs/variable_contract.md): definiciones operativas y qué falta medir en la sociedad.
- [Protocolo experimental breve](docs/experimental_protocol.md): distinguir polo–grupo de mera amplificación individual. Plan pendiente de ejecución, sin resultados inventados.
- En el simulador, selecciona una persona y pulsa **Avanzar 1 ronda y explicar** bajo los indicadores. Registra su cálculo real: vecinos, fuerzas, umbral, ruido y límites. No altera las reglas ni añade sorteos.
`node experiments/web_sensitivity.cjs` reproduce el diagnóstico local de 78
ejecuciones. No constituye validación empírica ni sensibilidad global.

## Simulador original: documentación vigente

La web conserva su formato original. Consulta [Teoría](web/formula.html) para
las ecuaciones, ejemplos numéricos, referencias y límites; [Guía](web/guide.html)
explica todos los controles. La [auditoría](docs/theory_audit.md) registra las
correcciones de cálculo y distingue hipótesis propias de fórmulas publicadas.
Los modelos Python y documentos previos corresponden a desarrollos históricos;
no son una réplica numéricamente equivalente de esta web.

Desde la carpeta `project`, inicia `python -m http.server 8765 --directory web`
y abre [el simulador local](http://localhost:8765/). Si ya hay un servidor en ese
puerto, no inicies otro: actualiza la página. Las pruebas son
`node web/verification.js` y `python -m pytest -q`.

ABM X es una simulación sencilla y visual para estudiar cómo pueden cambiar las opiniones de muchas personas cuando interactúan entre sí.

## La idea, explicada fácil

Imagina un cuadrado. Cada punto dentro del cuadrado representa a una persona. La posición del punto representa su opinión sobre dos temas diferentes:

- el eje X representa una dimensión de la opinión;
- el eje Y representa otra dimensión de la opinión.

Los puntos empiezan repartidos por el cuadrado y, con el paso del tiempo, pueden moverse. Se mueven porque escuchan a personas con opiniones parecidas, reciben la influencia de polos políticos, reaccionan ante acontecimientos y forman grupos de opinión.

El programa repite este proceso muchas veces. Cada repetición es un instante de tiempo, llamado `t`. Al observar todos esos instantes podemos estudiar si la sociedad llega a un consenso, se divide en grupos o se vuelve más polarizada.

## ¿Qué significa ABM?

ABM significa *Agent-Based Model*, o modelo basado en agentes.

En este proyecto, un agente es una persona simulada. El programa no intenta adivinar la opinión exacta de una persona real. Construye una población artificial para estudiar una pregunta:

> ¿Cómo pueden unas reglas sencillas de interacción producir un resultado colectivo, como la polarización?

Esto convierte el programa en un pequeño laboratorio. Podemos cambiar las reglas y observar qué ocurre.

## ¿Qué es la polarización?

La polarización aparece cuando la población se separa en posiciones alejadas, normalmente alrededor de dos polos. Una población en el centro no es necesariamente una población polarizada.

ABM X calcula un índice JDJ para resumir la posición de la población respecto a dos polos. Para cada agente se calcula su distancia euclídea a los dos polos y esa distancia se transforma en un grado de pertenencia a cada uno. Después se aplica la fórmula JDJ sobre esos grados de pertenencia.

El índice es una medida de salida: describe lo que está ocurriendo en la población. No debe interpretarse automáticamente como una verdad sobre la sociedad real.

## Qué puede hacer la simulación

- Simular agentes con opiniones en dos dimensiones.
- Hacer que los agentes escuchen a vecinos dentro de un radio de confianza.
- Dar a cada agente una tolerancia, susceptibilidad, anclaje y umbral de inmovilidad.
- Mantener las opiniones dentro del cuadrado `[0, 1] x [0, 1]`.
- Añadir dos polos permanentes de influencia.
- Crear acontecimientos temporales con fuerza, alcance, duración y fatiga.
- Crear contraeventos o reacciones opuestas.
- Detectar grupos compactos y representarlos como masas sociales.
- Comparar modelos clásicos con el modelo extendido.
- Ejecutar pruebas automáticas y simulaciones reproducibles mediante una semilla.
- Ver la dinámica en una interfaz web interactiva.
- Exportar resultados a CSV y Parquet.

## Una aclaración importante

El proyecto combina modelos conocidos de la literatura con extensiones de investigación. La confianza acotada, el anclaje y la susceptibilidad tienen antecedentes en modelos de dinámica de opiniones. La gravedad de los clusters, la fatiga de los eventos, los contraeventos y el rebote hacia el centro son mecanismos experimentales que necesitan calibración y validación con datos reales.

Por tanto, este programa es un laboratorio computacional reproducible. No es una prueba de que una sociedad real se comporte exactamente como la simulación.

## Cómo instalarlo

Se necesita Python 3.10 o una versión posterior.

```bash
cd ABM-X
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

En Windows, la activación del entorno virtual es:

```powershell
.venv\\Scripts\\activate
```

## Cómo comprobar que funciona

Ejecuta las pruebas:

```bash
python -m pytest
```

Las pruebas comprueban, entre otras cosas, las fronteras del espacio actitudinal, la reproducibilidad, los modelos base y los ejemplos del índice JDJ.

## Cómo ejecutar modelos

Comparación de modelos base:

```bash
python experiments/baseline_comparison.py --config data/default_config.yaml
```

Modelo extendido:

```bash
python experiments/run_final_model.py --config data/final_model.yaml
```

Análisis de sensibilidad:

```bash
python experiments/sensitivity_analysis.py --config data/final_model.yaml
```

Los resultados se guardan en `outputs/`. Esa carpeta contiene archivos generados y no se sube al repositorio para evitar mezclar resultados de una ejecución con el código del modelo.

## Cómo abrir la versión visual

Desde la carpeta `project`, inicia un servidor local:

```bash
python -m http.server 8765 --directory web
```

Después abre en el navegador:

```text
http://localhost:8765/
```

La página permite modificar las variables antes de lanzar la simulación. También incluye un enlace a la leyenda matemática, donde se explica qué significa cada variable y qué fórmula utiliza.

## Organización del proyecto

```text
src/          modelos, métricas y funciones matemáticas
tests/        pruebas automáticas
experiments/  experimentos reproducibles
data/         configuraciones YAML
docs/         auditoría, modelo matemático y revisión bibliográfica
references/   referencias y registro de búsquedas
web/          simulador visual y leyenda matemática
outputs/      resultados generados localmente
```

## Documentación recomendada

- `docs/code_audit.md`: auditoría del código y supuestos.
- `docs/mathematical_model.md`: ecuaciones del modelo.
- `docs/literature_review.md`: revisión de modelos y referencias.
- `docs/novelty_matrix.md`: antecedentes y posibles contribuciones.
- `docs/ODD_protocol.md`: descripción formal del modelo basado en agentes.
- `web/formula.html`: leyenda visual y matemática para entender la interfaz.

## Reproducibilidad

Las simulaciones utilizan una semilla aleatoria configurable. Para comparar dos ejecuciones hay que conservar la misma configuración YAML, la misma semilla y la misma versión del código.

La reproducibilidad computacional no significa que el modelo esté validado empíricamente. La validación requiere comparar sus resultados con datos reales y comprobar si las hipótesis explican mejor los patrones observados.

## Estado del proyecto

ABM X es una base de investigación en desarrollo. Sus resultados deben interpretarse como experimentos de simulación. Antes de presentar una conclusión científica, conviene realizar análisis de sensibilidad, estudios de ablación, calibración, validación fuera de muestra y una revisión bibliográfica actualizada.
