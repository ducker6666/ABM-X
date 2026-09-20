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
