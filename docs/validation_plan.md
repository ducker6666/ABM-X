# Plan de verificación y validación

## Nivel 1 — verificación de código (implementado)

- Distancia euclídea con caso 3–4–5.
- Ejemplo manual del promedio con señal.
- Prueba de sincronía.
- Señal fuera de ε sin efecto.
- Proyección A–B en extremos y centro.
- Casos límite JDJ.
- Componentes conexas conocidas.
- Semilla reproducible en la web.
- Contacto parcial DW con resultado manual.
- Anclaje FJ en g=1 y persistencia de diferencias.
- Red Watts–Strogatz sin lazos y no dirigida.
- Intervalos temporales con inicio incluido y final excluido.
- RMSE y TVD con casos conocidos.

Comandos:

```bash
python -m pytest
node web/verification.js
```

## Nivel 2 — validación interna del modelo (pendiente)

- Reproducir cualitativamente el caso HK bidimensional sin señales.
- Comprobar invariantes: opiniones dentro de `[0,1]^2`, señales fijas y determinismo dada una condición inicial.
- Comparar resultados Python y JavaScript para un conjunto de posiciones iniciales idéntico.
- Sensibilidad a `N`, duración y umbral descriptivo de cluster.
- Ablación: control, una señal, dos señales iguales, dos asimétricas.

## Nivel 3 — validación de patrones (pendiente)

Comparar patrones de consenso/fragmentación y seguimiento con los artículos de Fortunato et al. (2005) y Glass & Glass (2021). La comparación puede ser cualitativa al principio, pero debe documentar diferencias de dimensión y parámetros.

## Nivel 4 — validación empírica (no realizada)

Requiere:

- definir qué significan las dos dimensiones;
- obtener mediciones temporales de opiniones o discursos;
- operacionalizar señales observables;
- calibrar sin usar los mismos datos para evaluar;
- validar fuera de muestra;
- estudiar identificabilidad y modelos alternativos.

Hasta completar este nivel, la simulación es un experimento teórico reproducible, no una predicción de una sociedad concreta.

### Tubería disponible

`experiments/calibrate_phases.py` exige un CSV `agent_id,time,x,y`, al menos dos olas y coordenadas en `[0,1]`. Compara la última ola mediante RMSE individual y TVD de histogramas. No imputa ausencias ni genera observaciones.

Antes de usarla hay que fijar por escrito:

1. significado y validez de las dos escalas;
2. transformación de respuestas a `[0,1]`;
3. correspondencia entre intervalo real y número de rondas;
4. parámetros permitidos y rejilla antes de ver el test;
5. división entrenamiento/validación o validación temporal;
6. modelos alternativos y criterio de selección;
7. sensibilidad al número de bins de TVD.

Un mínimo de RMSE/TVD en los datos de ajuste no constituye una validación causal.
