# Registro de decisiones científicas

## 2026-09-20 — Recuperación auditable del modelo integrado

- La web presenta un único modelo integrado; los comparadores históricos dejan de aparecer como opciones configurables.
- Las columnas observadas A y B son grados de pertenencia y se usan directamente como posición inicial `(A,B)`. No se reinterpretan como distancias.
- Los polos se fijan en `A=(1,0)` y `B=(0,1)` y permanecen durante toda la simulación. Así conservan el significado del contrato de entrada.
- El contrato de entrada recibe directamente A y B en `[0,1]`; `pos` no entra en el motor. El CSV aportado contiene 950 filas y cumple `A+B=1` salvo redondeo, de modo que ese archivo concreto describe una dimensión bipolar.
- La población sintética sortea A y B de forma independiente para no imponer la diagonal `A+B=1`. Esta distribución es un escenario nulo, no una afirmación sobre datos reales; un CSV se conserva sin dispersión añadida.
- La intensidad visible se limita a 0–10 y se interpreta como peso equivalente de fuentes fijas. El límite 10 es un rango de interfaz, no una constante social.
- Cada polo tiene un radio de alcance explícito. Los eventos adicionales usan la misma operación y se registran por inicio, duración, intensidad y alcance.
- Cada evento genera un contraevento por reflexión respecto a `(0.5,0.5)`: `C=(1-x_E,1-y_E)`. La igualdad de inicio, intensidad, alcance y duración es una simetría experimental declarada, no una ley social.
- El modo aleatorio sortea de forma reproducible posición, inicio, intensidad, alcance y duración. El modo manual permite escribir posición y tiempo. Ambos crean la pareja opuesta.
- La interfaz usa 0–10 para fuerzas, pesos y distancias configurables, porcentajes para probabilidades/proporciones y 0–1 solo para coordenadas observadas. Cada conversión interna está documentada; no se equiparan magnitudes distintas.
- “Gravedad de clusters” significa suma normalizada de influencia individual: un grupo pesa por su número de voces, no por una ley física.
- Atracción, reactancia y norma común siguen la función de afinidad de Zhang, Hu y Zhang (2025); su extensión a vectores 2D está declarada.
- La resistencia por radicalidad sigue el compromiso de Duggins (2017). No se cambia el umbral epsilon con una fórmula no publicada.
- El ruido local sigue a Pineda, Toral y Hernández-García (2013); la pérdida de atención usa un decaimiento exponencial basado en Schweitzer et al. (2020).
- El auditor usa JDJ proyectado y dispersión. JDJ se calcula a partir de la posición actual `(x,y)`, proyectada mediante producto escalar sobre el eje A–B; no usa directamente la distancia euclídea a los polos. JDJ por sí solo puede dar riesgo medio a un consenso central; exigir dispersión impide intervenir en ese caso.
- La activación JDJ del recentrado y la suma completa de mecanismos son reglas operativas del proyecto, no teorías publicadas como conjunto.
- Se inspeccionaron los 25 PDF locales de `PhD Tesis` (24 trabajos únicos; el capítulo de Markov está duplicado por idioma). `web/guide.html` registra su uso.

## 2026-09-20 — Reinicio sobre el modelo original

### Se conserva

- Espacio visual bidimensional.
- Dos polos/señales visibles y configurables.
- Confianza acotada y evolución de agentes.
- JDJ como interés de medición, pero solo como salida secundaria.
- Tres páginas: simulador, fórmulas y narrativa del paper.

### Se corrige

- Actualización secuencial → síncrona.
- Inicialización bimodal por defecto → uniforme.
- Tres definiciones incompatibles de modelo → una formulación activa Python/web.
- “Fuerza de polos” gaussiana → señales constantes dentro de ε.
- Clusters como masas causales → clusters como resultados descriptivos.
- JDJ basado en similitudes 2D no publicadas → JDJ-Pro tras proyección geométrica declarada.

### Se retira del Paper 1

- Gravedad de clusters.
- Rebote al centro activado por un auditor.
- Eventos aleatorios, fatiga, reactancia y contraeventos.
- Tolerancia adaptativa, ruido, anclaje y umbral de inmovilidad.

Retirar no significa afirmar que estos fenómenos no existan. Significa que no se combinan antes de poder aislarlos, justificarlos y validarlos.

### Regla de honestidad

1. “Publicado” significa que la regla aparece en una fuente identificada.
2. “Adaptación” significa que una transformación técnica es nuestra y se declara.
3. “Operacional” significa que es necesaria para medir o ejecutar, pero no se presenta como ley social.
4. “Hipótesis” es algo que se va a probar, no un resultado.
5. “Resultado” solo se escribe después de ejecutar el protocolo y analizar todas las réplicas.

## 2026-09-20 — Laboratorio posterior por fases

### Motivo

El control HK puede superponer agentes exactamente y aparentar una atracción demasiado rápida. No se corrige con ruido o repulsión sin fuente: se compara con mecanismos publicados que responden a supuestos distintos.

### Decisiones

- El Paper 1 no cambia: HK 2D con señales constantes.
- La Fase 2 implementa contactos parciales Deffuant–Weisbuch.
- La Fase 3 implementa anclaje Friedkin–Johnsen y declara la composición con confianza acotada.
- La Fase 4 restringe la influencia a una red Watts–Strogatz sintética; no se presenta como red observada.
- La Fase 5 activa señales mediante intervalos rectangulares declarados; no usa fatiga inventada.
- La Fase 6 prepara calibración con RMSE y TVD, pero no genera datos ni resultados.
- La web abre por defecto en Fase 2 porque el compromiso parcial y el número limitado de contactos responden directamente al problema de la atracción demasiado rápida. “Más plausible” no significa “validada”.
