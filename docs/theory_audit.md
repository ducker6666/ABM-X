# Auditoría del simulador original — 20 septiembre 2026

## Alcance

La implementación auditada es `web/app.js`. Se mantiene la interfaz original,
los controles, los mecanismos y sus constantes. Se añaden Teoría y Guía,
sin framework ni dependencia matemática externa: fórmulas Unicode legibles sin conexión.
Los módulos Python del repositorio son modelos históricos diferentes; ejecutar sus
pruebas no demuestra equivalencia con este motor JavaScript. No se afirma tal equivalencia.
Los documentos anteriores de `docs/` describen iteraciones históricas; para la web
actual prevalecen `web/formula.html`, `web/guide.html` y este registro.

## Correcciones de cálculo

1. **Actualización síncrona.** Antes se modificaban posiciones durante la ronda,
   aunque la cuadrícula de vecinos seguía indexando el estado inicial. Ahora todas
   las fuerzas leen las posiciones de t y los resultados se aplican juntos.
   Esto puede cambiar las trayectorias; elimina la mezcla inadvertida de tiempos.
2. **Pesos polares estables.** Se resta el máximo antes de exponenciar (softmax).
   Antes, añadir 1e-9 al denominador de afinidades diminutas impedía que los pesos
   sumaran 1 y creaba un objetivo espurio cerca de (0,0). No cambia la fórmula
   ideal; sí corrige resultados con radios pequeños.
3. **JDJ sin redondeo previo.** Se conservan pertenencias euclídeas completas y
   se suman todos los pares, incluyendo i=j. Agrupar pertenencias idénticas es
   equivalente a la suma individual. El diagnóstico del grupo dominante sigue
   redondeando a dos decimales, pero no participa en el índice. Un único agente
   central da 0.5, no cero. Se retira el recorte final del índice.

## Evidencia y límites

Las diez referencias enlazadas en Teoría distinguen antecedentes de formulaciones
exactas. La vecindad adapta HK; el anclaje aditivo tiene antecedente en FJ, pero
no reproduce ese modelo. Softmax estable y Box–Muller tienen respaldo matemático.
La masa, gravedad, cierre de tolerancia, reactancia radial y disparador del auditor
son hipótesis propias, no leyes publicadas verificadas. No se han estimado sus
constantes con datos ni calibrado rondas a días.

La referencia Guevara2020 era incorrecta: no es PLOS ONE. Se corrige a capítulo
IPMU, CCIS 1238, pp. 510–522, DOI 10.1007/978-3-030-50143-3_40,
con los cuatro autores verificados en el texto completo de PMC.

No se afirma haber leído íntegramente todos los artículos de la carpeta de tesis.
Esta auditoría contrastó el código y las fuentes específicamente citadas.

## Comprobaciones reproducibles

Desde la raíz `project`:

```sh
node web/verification.js
python -m pytest -q
```

La suite web carga el motor real en un contexto Node, omitiendo únicamente el
arranque DOM. Incluye polos, centro, fuera del eje, ejemplo (0.2,0.4), suma JDJ
individual frente a agrupada, softmax extremo, ejemplo final (0.40855,0.5),
orden de actualización, umbral, tolerancia, vida media, contraevento, masa,
auditor, límites y ruido reproducible. No duplica el motor para probarse a sí misma.

Limitaciones conservadas y explicadas: radios gaussianos sin corte; atributos
individuales requieren reiniciar; el auditor no exige separación; el historial
recorta a 900 muestras y su eje temporal original no muestra exactamente la
ventana desplazada; el calendario de eventos es sintético, no un editor de datos.
