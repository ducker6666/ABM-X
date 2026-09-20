# Revisión de fundamento — 21 de septiembre de 2026

## Alcance y criterio

Esta revisión afecta al motor web. No reescribe los motores Python históricos ni declara equivalencia con ellos. El commit `77960e5` conserva la versión previa para recuperación y comparación. Las trayectorias, ejemplos polares y resultados de sensibilidad anteriores no describen automáticamente esta revisión.

Defendible no significa verdadero: significa especificar supuestos, derivación, alternativa y prueba que podría refutarlos. Las referencias se usan solo para lo que respaldan. Una derivación algebraica bajo una hipótesis no prueba esa hipótesis social.

## Decisiones aplicadas

1. **Se elimina q=1+6S.** Para q>0, q/(2ρ²)=1/[2(ρ/√q)²]. q no añade una familia de pesos distinta; además unía selectividad e intensidad sin fundamento específico. Ahora S escala exclusivamente la fuerza y ρ escala exclusivamente la distancia en los pesos.
2. **Se elimina 0.35+0.65|wA−wB|.** No se había justificado que dominar un polo deba añadir otra ganancia. No se reemplaza por otra cifra: se retira el supuesto.
3. **Fuerza polar P=S(T−u).** Se declaran semejanza gaussiana, simetría entre polos y ajuste lineal. Con pesos w calculados en u y fijados para este cálculo, minimizar J(v)=Σwₖ‖v−pₖ‖² da ∇J=2(v−Σwₖpₖ), de donde T=Σwₖpₖ. Esta prueba es local: no afirma una energía global decreciente al recalcular los pesos. El kernel gaussiano es una elección de familia, no se deduce de HK.
4. **Acoplamiento opcional κ(nₖ/N)P(cₖ).** Sumar nₖ aportaciones iguales κP(cₖ)/N da exactamente ese término. La hipótesis es representación colectiva en el centro e igual peso por miembro. Se retira la ganancia basal y se distingue proporción de población de la masa potencial (nₖ/N)^γ. El efecto colectivo sigue pendiente de contrastar con una ganancia individual equivalente.
5. **Atributos transparentes.** μ, α y λ son exactamente sus controles al reiniciar. Desaparecen dispersiones ocultas 0.08, 0.05, 0.04 y mínimo 0.02 de μ. Para ε, σ=ε̄h define una dispersión relativa; h=0 es homogeneidad. Se retiran el factor 0.25 y mínimos de ε: cero solo admite coincidencias exactas.
6. **Inicio mínimo.** Se conservan vecinos y polos. Ruido, heterogeneidad, umbral, anclaje, eventos, cierre adaptativo, gravedad, acoplamiento y retorno del auditor empiezan en cero. No se borran extensiones: activarlas se anuncia como elección experimental. Reiniciar no vuelve a poner controles a cero si el usuario los ha cambiado.

## Inventario de reglas y números todavía presentes

| Elemento | Tipo y función | Por qué ese valor / decisión y evaluación pendiente |
|---|---|---|
| Distancia euclídea | Definición matemática; mismo peso para ambos ejes | Usarla presupone escalas comparables. Definirlas antes de aplicar datos. |
| ε=0.30 | Parámetro del escenario de confianza acotada | No hay tolerancia humana universal 0.30. Barrer umbrales y/o estimar aceptación observada. |
| S=0.70, ρ=0.70 | Ajustes ilustrativos; intensidad y escala independientes | No se estimaron con datos. No se privilegian en conclusiones. Estudiar ambos y otras familias de peso. |
| 2ρ² en el kernel | Convención gaussiana | Define ρ por K(ρ)/K(0)=exp(−1/2). Otra constante positiva se absorbería en ρ; no es un parámetro social adicional. |
| Media de vecinos | Agentes aceptados con el mismo peso | Adaptación de HK, no HK literal; contrastar pesos desiguales si se dispone de exposición. |
| 240 agentes, semilla 123, 3000 rondas | Escenario y coste de cómputo | No representan población, calendario o muestra real. Replicar con otras semillas, tamaños y horizontes. |
| Dos nubes, centros (.28,.70)/(.73,.29), dispersiones (.15,.14)/(.14,.13) | Escenario sintético heredado | No hay evidencia para esas cifras. Mantenerlas no las valida: variar separación/dispersión y probar otros inicios. |
| Recorte inicial .02… .98 | Margen visual respecto al borde | No observado. Forma masas en los extremos del recorte, no una normal truncada por rechazo. Sensibilidad al margen pendiente. |
| h y normal para tolerancia | Distribución opcional | h es desviación relativa antes de recortar; la forma normal no es una medición. Base h=0. |
| 0.075 y tope 0.05 | Paso de actualización y límite por ronda | Son resoluciones operativas heredadas, no parámetros sociales estimados. Reducir paso con horizonte numérico equivalente y medir activación del límite antes de interpretar velocidades. |
| 0.012 × ruido | Desviación numérica por eje | Sin estimación; base cero. Si se estudia convergencia temporal con ruido debe declararse cómo se escala su varianza con el paso: el motor no lo hace automáticamente. |
| Radios mínimos .02 | Evitar divisiones por cero / escala mínima de interfaz | No distancia social mínima observada. Evaluar sensibilidad o usar límites analíticos en una futura revisión. |
| Detector: 5 iteraciones, cambio .002, mínimo 20 | Aproximación algorítmica con exclusión | No identifica comunidades reales. Variar resolución, tamaño mínimo y orden; revisar estabilidad antes de interpretar grupos. |
| γ=.5+1.5cγ | Rango experimental de masa, .5 a 2 | No hay razón empírica para ese rango. Solo afecta gravedad/inercia opcionales; no el nuevo acoplamiento. |
| Gravedad: mínimo .01, b=.02+.18ρg | Regularización de fuerza opcional | Función suave para impedir singularidad; valores no calibrados. Comparar con atracción lineal y sin gravedad. Base desactivada. |
| Cierre (1−cr r)(1−cm M) | Hipótesis de reducciones multiplicativas | Ni distancia al centro ni masa prueban cierre psicológico. Base desactivada; contrastar reducciones por separado. |
| Calendario 30+970(1−f), duración 20+180cD | Conversión de interfaz a rondas | Rangos heredados, sin escala temporal empírica. Base sin eventos. Para datos reales, sustituir por calendario observado. |
| Jitter .65…1.35, intervalo mínimo 8 | Escenario aleatorio acotado | No proceso Poisson ni intervalo estimado. Comparar calendarios, no inferir regularidades sociales de él. |
| Contraevento: +3, duración ×.65, intensidad ×.55, reflexión | Respuesta artificial más tarde y débil | Ninguna fuente establece esos valores. Hipótesis, no mecanismo general demostrado. Incluso el lado opuesto depende de posición de polos. |
| Vida media 1+299(1−cdec) | Parametrización del decaimiento exponencial | 1…300 son límites de escenario. La ecuación da pérdida proporcional, no prueba cansancio social. |
| Reactancia con mínimo .02 | Repulsión radial opcional por lado | Evidencia psicológica de reactancia no determina esta ecuación ni que pertenecer al otro lado la active. |
| JDJ, normalización √2 | Medida euclídea especificada | √2 es la diagonal del dominio. No cambiar fórmula del usuario. Cotejo literal completo con la medida publicada y validez 2D siguen pendientes. |
| Balance 4m(1−m), separación 4Var(b) | Identidades descriptivas | El 4 normaliza máximos para valores en [0,1]; balance no cuenta bandos. |
| Auditor .60/.70, paciencia 1+119cτ | Política de intervención programada | No umbrales sociales descubiertos. Fuerza cero al iniciar; evaluación normativa y causal separada. |
| clip y saturación del gráfico en 1 | Dominio y representación | No confundir recorte con rebote ni saturación visual con intensidad real. |

## Pruebas que justifican la implementación, no la sociedad

Se comprueban independencia de pesos frente a S, proporcionalidad exacta de P respecto a S, simetría al intercambiar polos, mínimo cuadrático con pesos congelados, desaparición de respuesta con μ=0 y α/λ exactamente cero, ε=0 y acoplamiento κnₖ/N independiente de γ. Se mantienen pruebas de las extensiones aunque estén desactivadas por defecto.

El protocolo experimental debe ejecutarse con esta versión, población/semillas compartidas y salidas que incluyan saturaciones y distribución de opiniones. Los resultados anteriores quedan históricos. No se ha realizado aún validación con datos ni demostrado que las constantes numéricas restantes sean inocuas.

Diagnóstico local ejecutado: [78 corridas, 6 semillas, N=80 y 120 rondas](web_sensitivity_review.json). Los controles se limitan a [0,1]; intentar restar 0.01 a un control inicialmente cero es una réplica del caso base, no una perturbación negativa. El tamaño mínimo de cluster sigue siendo 20, así que este diagnóstico no mantiene su proporción respecto a N=240. La variación de masa +0.01 cambia JDJ final medio en aproximadamente −0.01155; ε−0.01 en +0.00098 y ε+0.01 en −0.00361. Son resultados de estos escenarios, no regularidades sociales ni prueba de robustez global.

## Fuentes y alcance consultado

- [Hegselmann y Krause (2002)](https://www.jasss.org/5/3/2.html): antecedente de confianza acotada y promedio. La ficha y el resumen no validan nuestra suma completa.
- [Hegselmann y Krause (2015)](https://www.aimsciences.org/article/doi/10.3934/nhm.2015.10.477): señales constantes con intensidad y aceptación por proximidad. No publica el kernel gaussiano ni gravedad usados aquí.
- [Blanchard, Higham y Higham, preprint](https://arxiv.org/abs/1909.03469): estabilidad numérica de softmax. No contiene una teoría sociológica de atracción.
- [Grimm et al. (2020), ODD](https://www.jasss.org/23/2/7.html): descripción reproducible de entidades, procesos y decisiones. No certifica validez empírica.

No se ha efectuado en esta revisión una lectura integral de todos los artículos de la carpeta de tesis. Tampoco se atribuye a una fuente una fórmula solo por compartir vocabulario con ella.
