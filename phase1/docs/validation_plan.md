# Plan de verificación, análisis y validación

## 1. Verificación matemática

- calcular manualmente pasos pequeños;
- comprobar auto inclusión y actualización síncrona;
- verificar que todas las opiniones permanecen en `[0,1]`;
- contrastar JDJ con la suma doble explícita;
- documentar casos en los que JDJ no distingue configuraciones;
- comprobar paridad Python–JavaScript con fixtures compartidos.

Estado actual: implementado en `phase1/tests/` y `web/verification.js`.

## 2. Verificación de software

- validación de entradas;
- semillas reproducibles;
- pruebas unitarias y cruzadas;
- exportación de resultados;
- revisión visual en escritorio y móvil;
- registro de versión y configuración por experimento.

## 3. Diseño experimental previo al artículo

El análisis principal deberá fijarse antes de observar resultados definitivos:

- rejilla o diseño de `epsilon`;
- número de agentes;
- horizonte máximo;
- número de semillas por condición;
- escenarios primarios y análisis de robustez;
- definición operacional de consenso y grupos;
- estadísticos e intervalos de incertidumbre;
- tratamiento de ejecuciones no convergentes.

No se escogerán únicamente semillas con gráficos atractivos.

## 4. Sensibilidad

Para Fase 1, `epsilon` es el único parámetro conductual. Se examinarán además
los parámetros experimentales `n`, horizonte, tolerancia de convergencia y
umbral descriptivo de grupos. Este último no cambia la dinámica, pero puede
cambiar la interpretación.

## 5. Validación conceptual

- revisión por especialistas del significado de polarización;
- escenarios extremos conocidos;
- comparación simultánea de medidas;
- declaración de qué concepto observa cada indicador;
- comprobación de que las conclusiones no exceden los supuestos.

## 6. Validación empírica

No se afirma validación empírica en Fase 1. Para realizarla harían falta una
pregunta sustantiva, datos de panel o repetidos, correspondencia temporal,
definición observable de exposición/interacción y evaluación fuera de muestra.

## 7. Criterios para avanzar

Fase 1 estará científicamente lista cuando:

1. todas las pruebas pasen;
2. web y Python produzcan resultados equivalentes;
3. el protocolo experimental esté congelado;
4. se complete una revisión sistemática de novedad;
5. un tercero pueda reimplementar el modelo a partir del ODD;
6. las conclusiones se limiten a medición y comportamiento del modelo.
