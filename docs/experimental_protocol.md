# Protocolo breve: ¿aporta algo el acoplamiento polo–grupo?

**Estado:** plan de un experimento exploratorio, pendiente de ejecución. No es una preregistración, no contiene resultados y no declara validez empírica. El control de ganancia descrito abajo todavía no está implementado. Se conserva el simulador actual.

## 1. Pregunta y posibilidad de refutación

¿Evaluar una parte de la influencia polar en el centro del grupo cambia la distribución de opiniones respecto a una influencia puramente individual de intensidad comparable?

La hipótesis no es «más fuerza produce más movimiento». Es que la **posición colectiva usada para calcular la fuerza** aporta algo distinto. Un resultado nulo, o diferencias explicadas por el aumento de intensidad, debilitaría esa aportación. Encontrar diferencias dentro del simulador no demostraría por sí solo que el mecanismo existe en la sociedad.

## 2. Tres condiciones comparables

Sea P(uᵢ) el vector polar individual que ya calcula el motor; cₖ el centro del grupo; y gₖ=κfₖ, con fₖ=nₖ/N.

| Condición | Término polar | Pregunta |
|---|---|---|
| Individual | P(uᵢ) | ¿Qué ocurre sin el añadido? |
| Individual con ganancia | (1+gₖ)P(uᵢ) | ¿Basta amplificar la influencia individual? |
| Polo–grupo actual | P(uᵢ)+gₖP(cₖ) | ¿Importa evaluar la fuerza en el grupo? |

Sin grupo asignado, gₖ=0 en las tres condiciones. «Ganancia» es un **control experimental propuesto**, no una teoría publicada ni un ajuste exacto de la norma de la fuerza: iguala el multiplicador, no necesariamente la magnitud resultante. No basta subir «Fuerza polos»: S ahora cuenta aportaciones y cambia también el denominador; gₖ depende de cada grupo. La condición de ganancia debe aplicarse al vector individual ya calculado, no modificando S. El término de centro usa εᵢ y cero vecinos en su denominador (véase bounded_signals.md).

Si todos los miembros coinciden con su centro, las dos últimas expresiones son idénticas. Esa igualdad será una prueba obligatoria del futuro comparador. Para grupos dispersos, no podemos anticipar ni dirección ni tamaño de las diferencias.

## 3. Diseño inicial acotado

- Motor de referencia: versión web actual. Archivar commit, configuración efectiva, población inicial y semillas. No mezclar con los motores Python históricos.
- Piloto propuesto: N=240, T=600 rondas, semillas 1–30, κ en {0, 0.35, 0.70, 1}. Ejecutar las tres condiciones emparejadas por semilla e inicio. Estos números son decisiones de coste y exploración, no garantía de potencia estadística.
- Mantener los dos polos y demás controles por defecto; desactivar eventos (frecuencia=0), ruido=0 y retorno del auditor (fuerza centro=0) para aislar primero el mecanismo. Publicar todos los valores efectivos, no solo los deslizadores.
- Mantener la detección de grupos bajo el mismo algoritmo y parámetros en las tres condiciones, incluso al apagar el acoplamiento. Sus grupos pueden divergir después como consecuencia de sus trayectorias: eso forma parte del efecto total.
- Inicialización del piloto: las dos nubes actuales, con posiciones y atributos idénticos dentro de cada comparación. No cambiar parámetros durante la ejecución.
- Tras el piloto, fijar por escrito un estudio de robustez: grupos más compactos/dispersos, otra población, otros radios y umbrales, y alternativas a la ponderación por tamaño relativo. Separar esos análisis del contraste principal; no escoger solo escenarios favorables.

Para ruido o eventos posteriores, reutilizar realizaciones previamente generadas e idénticas por ronda/agente, no confiar solo en una semilla compartida si las ramas del programa consumen sorteos distintos. Probar eventos y auditor en experimentos separados. El auditor responde al JDJ y puede producir una reducción por construcción.

## 4. Qué registrar y comparar

**Resultado principal:** diferencia emparejada en JDJ al final (polo–grupo menos control de ganancia), para cada κ. Reportar todas las semillas, media de diferencias y un intervalo de incertidumbre del 95% por remuestreo de semillas completas; no tratar agentes o rondas como réplicas independientes. Con κ=0 las tres condiciones deben coincidir exactamente.

**Diagnósticos secundarios:** trayectoria de JDJ, separación, distribución bidimensional final, tamaños y número de grupos, y fracción de movimientos que activan el límite de 0.05 o el recorte de bordes. Si domina la saturación, una diferencia puede provenir del límite numérico. Comparar también desplazamientos de un solo paso desde estados idénticos, antes de que diverjan los grupos.

JDJ central=0.5 para polos opuestos: acompañarlo de distribuciones, no llamar «dos bandos» a cualquier JDJ alto. El recuento de clusters depende del detector; no usarlo como verdad social.

Reportar incertidumbre del piloto sin detenerlo al obtener un resultado atractivo. Cualquier ampliación de semillas o cambio de hipótesis se documentará como revisión del protocolo. Antes de una evaluación confirmatoria, definir precisión deseada y efecto mínimo relevante; aún no hay una escala social que permita fijarlos con fundamento.

## 5. Verificación, reproducción y salida

Antes de experimentar: tests de las tres fórmulas, κ=0, ausencia de grupo, grupo compacto, actualización síncrona, límites y sorteos compartidos. El inspector permite contrastar operaciones, pero no sustituye estas pruebas ni constituye validación social.

Guardar por ejecución: versión, configuración completa, identificador de condición, semilla, estado inicial y series. Archivar script que produce tablas/figuras y manifiesto de ejecuciones. No borrar corridas sin efecto ni prometer coincidencia con COVID. El ajuste y evaluación longitudinal con datos externos será otro estudio, con separación temporal y comparación predictiva frente a baselines simples.

## 6. Qué podría convertirse en artículo

Pregunta → antecedentes → modelo con descripción ODD → controles y protocolo → resultados ejecutados → análisis de sensibilidad → límites y materiales reproducibles. La contribución posible es identificar **cuándo el cálculo colectivo es distinguible de una ganancia individual y cuándo no**. No se promete novedad bibliográfica, publicabilidad ni impacto antes de contrastarlo.

ODD ofrece una estructura para describir entidades, escalas, procesos e inicialización reproducibles: [Grimm et al. (2020)](https://www.jasss.org/23/2/7.html). La evaluación debe responder al uso previsto, no solo a que el código funcione: [Collins, Koehler y Lynch (2024)](https://www.jasss.org/27/1/11.html). Estas referencias orientan la metodología; no respaldan la fórmula propia polo–grupo.
