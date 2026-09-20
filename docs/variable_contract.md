# Significado de las variables

Este contrato describe **el motor actual de `web/app.js`**, no los motores Python históricos. Es una definición operativa del experimento, no una calibración social. Las ecuaciones completas y sus antecedentes están en [Teoría](../web/formula.html); los controles, rangos y conversiones, en [Guía](../web/guide.html).

## Qué representa cada cantidad

| Cantidad | Definición que utilizaremos | Qué no podemos afirmar |
|---|---|---|
| Agente i | Persona artificial con dos coordenadas y atributos individuales | Que representa a una persona observada sin una regla de muestreo |
| uᵢ=(xᵢ,yᵢ) | Dos dimensiones abstractas de actitud, ambas entre 0 y 1 | Que x e y son automáticamente pertenencias a A y B, porcentajes o probabilidades |
| A, B | Posiciones de referencia persistentes; valores actuales por defecto A=(0,1), B=(1,0) | Que son partidos concretos o que los ejes ya miden izquierda/derecha |
| Distancia | Distancia euclídea entre posiciones en este espacio | Distancia física o desacuerdo medido empíricamente |
| μA, μB | Pertenencias derivadas: 1 − distancia al polo / √2, limitadas a [0,1] | Que deban sumar 1 o ser iguales a x e y |
| t | Número entero de rondas de actualización síncrona | Días, semanas o velocidad social real |
| dt=0.075 | Multiplicador numérico del movimiento dirigido | Duración física de una ronda |
| εᵢ | Radio de aceptación de vecinos y polos: distancia ≤ εᵢ; los polos además requieren distancia ≤ ρ | Red de amistades o probabilidad de escuchar |
| S | Aportaciones equivalentes por polo aceptado: 1 cuenta como una persona, 3 como tres. Control común, rango ilustrativo 0–10 | Fuerza empírica conocida o garantía de dominancia |
| ρ | Alcance máximo de exposición a cada polo, común a ambos | Aceptación automática: ε también debe cumplirse |
| Dᵢ | 1 propia + número de vecinos + pesos de señales aceptadas | Normalización independiente de cada fuerza |
| μᵢ | Susceptibilidad individual: multiplica la respuesta dirigida | Pertenencia μA/μB; se reutiliza la letra, no la magnitud |
| αᵢ | Umbral: hay movimiento dirigido solo si la norma de la fuerza total supera αᵢ | Inmovilidad absoluta: el ruido se añade después |
| λᵢ | Coeficiente del retorno hacia la posición inicial propia | Retorno al centro o aplicación literal de Friedkin–Johnsen |
| Cluster k | Agrupación geométrica detectada por el algoritmo actual; centro cₖ y tamaño nₖ | Comunidad social observada, identidad colectiva o vínculos estables |
| Mₖ | Masa numérica (nₖ/N)^γ para gravedad; el acoplamiento usa directamente nₖ/N; γ=0.5+1.5×control | Personas, poder real o masa física |
| κ | Control «Atracción polo-masa»: escala la fuerza polar evaluada en cₖ | Evidencia de que las personas obedecen a una identidad de grupo |
| Fuerzas | Vectores de cambio propuestos; se suman componente a componente antes del umbral | Newtons, causas identificadas o efectos sociales estimados |
| Ruido | Sorteos gaussianos independientes por coordenada, desviación 0.012×control | Error de medición o volatilidad empírica ya estimada |
| Evento | Señal temporal generada por reglas y sorteos explícitos | Un acontecimiento histórico identificado |
| Auditor | Regla programada de retorno al centro tras superar umbrales | Institución real o prueba de que centrar opiniones es deseable |
| JDJ | Agregación de pertenencias euclídeas, incluyendo todos los pares ordenados y diagonales | Prueba suficiente de dos bandos o perjuicio social |

Ejemplo que evita confusiones: en u=(0.2,0.4), con los polos **por defecto de esta versión**, μA≈0.552786 y μB≈0.367544. Si intercambias las etiquetas de los polos, se intercambian las pertenencias; el JDJ simétrico no cambia. No hemos cambiado la configuración ni el cálculo del modelo para imponer otra convención.

## Interpretación y fundamento

- Escuchar opiniones próximas tiene como antecedente la confianza acotada de Hegselmann–Krause (2002). La implementación con velocidad, umbral y otros términos es una **adaptación**, no HK literal.
- Persistencia respecto a la opinión inicial tiene antecedentes en Friedkin–Johnsen. Este anclaje aditivo no reproduce sin más aquel modelo.
- Distancias, medias, suma de vectores y límites son operaciones matemáticas explícitas. Su corrección aritmética no valida una interpretación social.
- Masa, acoplamiento polo–grupo, cierre por distancia al centro y auditor son **hipótesis operativas propias**. La revisión elimina el suelo 0.35 y usa κ(nₖ/N): se deduce de asignar igual peso 1/N a cada miembro, pero la hipótesis colectiva sigue sin validar.
- Decaimiento y reactancia tienen antecedentes conceptuales; la regla concreta de eventos y contraeventos sigue siendo una decisión de modelización. Las referencias y límites de atribución se detallan en la página Teoría.

## Antes de usar datos reales

Hay que fijar qué pregunta observada mide cada eje, su escala, incertidumbre y fechas; justificar las posiciones de los polos; y decidir cómo se convierten los registros en posiciones. Dos columnas de pertenencia normalizada no deben tratarse silenciosamente como coordenadas ni invertirse como distancias sin comprobar compatibilidad geométrica. Si A+B=1, la representación directa (A,B) cae en una diagonal: dispersarla artificialmente cambia los datos.

También falta definir una correspondencia temporal y separar datos de ajuste y evaluación. **Ninguno de estos puntos queda resuelto por una animación convincente.**

## Aprender a defenderlo

Selecciona un agente y avanza una ronda con el inspector. Explica: qué vecinos entraron; qué fila domina o compensa otra; si superó α; cuánto añadió el ruido; y si actuaron los límites. Después identifica qué partes son matemáticas, qué partes son decisiones propias y qué observación permitiría rechazar cada hipótesis.
