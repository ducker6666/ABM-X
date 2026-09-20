# Informe final

> **Documento histórico del prototipo inicial.** No describe la formulación activa del Paper 1. Consulte `web/paper.html` y `docs/research_decisions.md`.

## A. Resumen ejecutivo

El archivo exacto `modelo_basado_en_agentes (1).py` no se localizo. El archivo disponible mas cercano, `Modelo base agentes.py`, implementa Vicsek: agentes con posiciones fisicas en un toro, direccion angular, velocidad constante, radio metricamente fisico, ruido angular uniforme y parametro de orden de alineamiento. No implementa un modelo de polarizacion politica, ni confianza acotada, ni red social, ni JDJ, ni estados actitudinales en `[0,1]^d`.

El codigo es razonablemente correcto como Vicsek pedagogico, salvo dependencia de `n` global, mezcla modelo-visualizacion, ausencia de validacion y uso de RNG global. Su mayor problema academico no es numerico sino conceptual: reinterpreta posiciones/direcciones fisicas como actitudes sin justificacion. Periodicidad hace que extremos actitudinales sean vecinos; el parametro de orden no mide polarizacion.

El modelo recomendado como base es Hegselmann-Krause en red, con Deffuant-Weisbuch como alternativa pairwise y Friedkin-Johnsen para obstinacion/anclaje. La contribucion prometedora no es "crear tolerancia" o "radio adaptativo", porque existen antecedentes parciales o proximos. La oportunidad esta en acoplar JDJ global y JDJ local experimentado a la tolerancia individual, distinguir polarizacion ideologica de estructural, e introducir eventos con decaimiento/contraeventos como mecanismo de transicion de episodico a estructural.

## B. Dictamen sobre el codigo

Modelo identificado: Vicsek et al. 1995. Fidelidad: alta como version simplificada. Correccion: circular mean y frontera periodica son correctas para Vicsek; la funcion depende indebidamente de `n` global. Adecuacion: baja para polarizacion politica en redes sociales.

## C. Modelo recomendado

Referencia: HK en red. Alternativa: Deffuant-Weisbuch. Extendido final: HK + FJ + eventos + confianza adaptativa por JDJ global/local.

## D. Estado del arte

Principales familias: DeGroot/FJ, bounded confidence HK/DW, Axelrod, voter/Sznajd/CODA, social impact, negative influence, stubborn/media fields, adaptive networks, higher-order/hypergraph, event-driven BCM y PMMC/JDJ.

## E. Evaluacion 3.0-3.7

3.0: separar `epsilon_i`, `mu_i`, `lambda_i`, `alpha_i` es correcto conceptualmente; casi todos tienen antecedentes parciales.

3.1: la literatura ya cubre tolerancia, obstinacion, heterogeneidad, adaptacion y repulsion; la combinacion JDJ-local feedback parece menos cubierta.

3.2: usar proyeccion/saturacion para `[0,1]^d`; reflexion puede probarse como sensibilidad; periodicidad debe descartarse para actitudes.

3.3: polos/eventos tienen antecedentes en medios, stubborn agents y shocks; deben formularse como campos externos con alcance y decaimiento.

3.4: media local es HK; mediana/mediana geometrica son robustas y menos comunes; clusters con masa conectan con hipergrafos y pesos.

3.5: radio heterogeneo esta cubierto.

3.6: radio adaptativo existe parcialmente; dependencia de JDJ local/global es oportunidad.

3.7: un 50/50 no implica centro; solo cancelacion si fuerzas simetricas. Recentrado requiere mecanismo adicional.

## F. Novedad

Propuesta ya cubierta por la literatura: Vicsek para alineamiento, HK/DW, tolerancia, susceptibilidad, obstinacion, media local, campos externos. Existen antecedentes parciales: eventos, repulsion, confianza adaptativa, clusters, fatiga, contraeventos, ciclos. No localizado en la busqueda realizada: JDJ como variable endogena micro, JDJ local individual, transicion episodico-estructural con JDJ. La novedad no puede asegurarse todavia.

## G. Propuesta final

Pregunta: cuando la polarizacion experimentada local modifica la tolerancia individual, puede una polarizacion episodica por eventos convertirse en polarizacion estructural?

Hipotesis: brechas `P_i^exp-P_G` persistentes reducen tolerancia, aumentan modularidad y estabilizan clusters ideologicos.

Ecuaciones: ver `mathematical_model.md`.

Diseno: Monte Carlo, sensibilidad global, ablacion por mecanismo, comparacion HK/FJ/eventos/JDJ-feedback, validacion con series de opiniones-red-eventos.

Implementacion entregada: `src/final_model.py` y `experiments/run_final_model.py`. El modelo ejecutable incluye HK en red, anclaje FJ, heterogeneidad individual, polos permanentes, eventos temporales con decaimiento exponencial, fatiga, polarizacion difusa global/local y modularidad estructural. La configuracion reproducible esta en `data/final_model.yaml`.

## H. Riesgos

Equifinalidad, sobreparametrizacion, baja identificabilidad, validacion insuficiente, circularidad al usar JDJ como causa y salida, falacia ecologica, doble conteo de red/opinion, interpretacion fisica inadecuada heredada de Vicsek.

## I. Recomendacion final

Reformular. Continuar solo si se abandona Vicsek como modelo de polarizacion politica y se usa como maximo ejemplo negativo/auditado. Investigar mas la fuente original JDJ antes de convertirlo en variable endogena.

Estado tras esta entrega: continuar con el modelo HK/FJ/eventos como prototipo minimo ejecutable, pero marcar la parte JDJ como `JDJ-like` hasta verificar e implementar exactamente la formula original.
