# Protocolo experimental provisional

Este documento separa las pruebas de software de los experimentos científicos.
No debe considerarse prerregistro confirmatorio hasta completar la revisión de
novedad y congelar hipótesis y análisis.

## Factores

- escenario inicial: uniforme, central, bipolar 50/50, bipolar 70/30 y tres
  grupos;
- `epsilon`: rejilla previamente declarada;
- semilla: réplicas independientes de inicialización;
- análisis de robustez: tamaño poblacional, horizonte y umbral descriptivo de
  grupos.

## Respuestas

- distribución final completa de opiniones;
- tiempo de convergencia;
- media, varianza normalizada y amplitud;
- `JDJ_Pro` bruto y normalizado;
- número operativo de grupos.

## Comparaciones prioritarias

1. consenso central frente a bipolaridad equilibrada;
2. bipolaridad equilibrada frente a 70/30;
3. bipolaridad frente a tres grupos;
4. trayectoria desde distribución uniforme para diferentes `epsilon`.

## Principio de análisis

La unidad de réplica es una simulación completa, no cada agente. Se informarán
distribuciones e intervalos entre semillas. No se seleccionará una semilla para
representar una condición sin mostrar la variabilidad total.

## Ejecución piloto

```bash
python -m phase1.experiments.run_grid \
  --replications 20 \
  --epsilons 0.05,0.10,0.15,0.20,0.25,0.30,0.40,0.50
```

La salida se guarda en `phase1/outputs/` y no se versiona por defecto. Un
conjunto de resultados destinado al artículo deberá incluir versión de código,
configuración, fecha y suma de comprobación.

## Decisiones pendientes antes del lote confirmatorio

- hipótesis y contrastes primarios;
- número de réplicas justificado por precisión Monte Carlo;
- tratamiento de comparaciones múltiples;
- intervalos y visualizaciones preespecificados;
- análisis de sensibilidad del umbral de grupos;
- política para ejecuciones que no converjan.
