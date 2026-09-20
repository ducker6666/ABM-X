# Revisión de cumplimiento del simulador web

> **Documento histórico del simulador anterior.** La implementación activa y sus pruebas se describen en `docs/formula_file_map.md` y `docs/validation_plan.md`.

Fecha de revisión: 2026-06-22.

Este documento evalúa el simulador `project/web` frente a los puntos de diseño solicitados. La evaluación distingue entre implementación computacional, coherencia matemática y validación científica.

## Dictamen breve

El simulador sí es un ABM visual ejecutable de opiniones en un espacio actitudinal bidimensional \([0,1]^2\). Implementa agentes, confianza acotada, inmovilidad, polos permanentes, eventos temporales con fatiga, contraeventos, clusters con masa, frontera por saturación y JDJ calculado según el código aportado por el usuario.

No debe presentarse todavía como modelo científico validado. Es un prototipo exploratorio y demostrable. Faltan calibración empírica, análisis de sensibilidad, comparación con datos reales y justificación bibliográfica completa de algunos mecanismos propuestos.

## Verificaciones ejecutables

Archivo: `project/web/verification.js`.

Comprobaciones incluidas:

- JDJ de división extrema 50/50: debe dar 1.
- JDJ de cuatro agentes en el centro: debe dar 0.5 con la fórmula de contenido aportada.
- JDJ de dos usuarios del ejemplo \((0.9,0.1)\) y \((0.2,0.8)\): debe dar 0.845.
- JDJ de 240 agentes homogéneos cerca de B, \((A,B)=(0.2,0.8)\): debe dar 0.32.
- Frontera inferior y superior por `clip`.
- Masa de cluster crece con el tamaño del grupo.
- Mayor frecuencia de eventos reduce el intervalo medio entre shocks.
- Atracción polo-masa aumenta la tracción polar cuando un grupo compacto está cerca de un polo.
- El ruido funciona como escala de perturbación residual exógena.

Ejecución:

```bash
node project/web/verification.js
```

## Cumplimiento de puntos 3.0-3.7

| Punto | Estado | Evidencia en código | Comentario |
|---|---:|---|---|
| 3.0 Inmovilidad alfa | Implementado | `alpha`, `forceNorm > a.alpha` en `app.js` | El agente solo responde a fuerzas dirigidas si superan el umbral; el ruido residual puede producir microvariación. |
| Tolerancia \(\varepsilon_i\) | Implementado | `a.eps`, `epsilonMean`, `epsilonHeterogeneity` | Define vecindad local interpersonal. |
| Susceptibilidad \(\mu_i\) | Implementado | `a.mu`, `mu` | Escala el desplazamiento cuando se supera \(\alpha_i\). |
| Anclaje \(\lambda_i\) | Implementado | `anchorX`, `anchorY`, `a.lambda` | Fuerza de retorno al estado inicial. |
| 3.1 Estado de literatura | Parcial | `formula.html`, docs existentes | Hay referencias base, pero no revisión sistemática completa dentro de la web. |
| 3.2 Condiciones de contorno | Implementado | `clamp(a.x + moveX, 0, 1)` | Frontera por saturación en \([0,1]^2\). |
| 3.3 Polos permanentes | Implementado | `poleForce()` | Polos A y B ejercen atracción continuada por afinidad. |
| 3.3 Eventos temporales | Implementado | `maybeEvents()`, `eventAmp()` | Shocks episódicos con posición, fuerza, radio, duración y decaimiento. |
| 3.3.1 Fatiga | Implementado | `eventAmp()` | Decaimiento exponencial por vida media. |
| 3.3.2 Contraeventos | Prototipo | `counterEvent` en `maybeEvents()` | Contraevento espejado; falta modelo empírico de ramificación. |
| 3.4 Clusters con masa | Implementado | `detectClusters()`, fuerza cluster, atracción polo-masa | Grupos compactos detectados por centroide local generan atracción proporcional a masa; la masa también puede ser arrastrada por polos cercanos. |
| 3.5 Radio heterogéneo | Implementado | `eps0` individual | Cada agente tiene tolerancia inicial propia. |
| 3.6 Radio adaptativo | Implementado como prototipo | `radicalToleranceLoss`, `massToleranceLoss` | \(\varepsilon_i(t)\) baja con radicalidad y masa del cluster. |
| 3.7 Recuperación del centro/ciclos | Prototipo | `centerRebound`, `highPolCount` | Auditor activa centro si JDJ y balance 50/50 superan umbrales sostenidos. No validado. |

## Limitaciones importantes

1. La pertenencia JDJ \((A,B)\) se obtiene con similitud euclídea normalizada a los polos: \(d_{iA}=||x_i-P_A||_2\), \(d_{iB}=||x_i-P_B||_2\), \(d_{\max}=\sqrt{2}\), \(\mu_A=1-d_{iA}/\sqrt{2}\), \(\mu_B=1-d_{iB}/\sqrt{2}\). Esto adapta opiniones 2D a probabilidades tipo `Prob_0`, `Prob_1`.
2. El JDJ se calcula según el último código aportado `jdj_content`, con redondeo a dos decimales y ponderación `Freq_i * Freq_j` sin corrección diagonal.
3. `Separación diagnóstica` es un diagnóstico auxiliar, no sustituye al JDJ.
4. La fuerza de clusters es una propuesta física-social. Es útil para explorar hipótesis, pero requiere sensibilidad y calibración.
5. Los eventos son exógenos y aleatorios; los contraeventos son endógenos simplificados.
6. El auditor de centro puede introducir circularidad si JDJ se usa a la vez como causa y salida principal.
7. No hay todavía validación empírica con series reales de opiniones, redes o eventos.

## Veredicto

Para exploración visual y prototipado de hipótesis: cumple.

Para afirmar que es un modelo validado de polarización política: todavía no cumple.

Para avanzar hacia una versión defendible: el siguiente paso debe ser un experimento reproducible con sensibilidad global, ablation study, métricas exportadas y comparación con datos reales o casos sintéticos controlados.
