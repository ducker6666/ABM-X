# Evaluación para artículo y tesis

> HISTÓRICO: describe la versión del 20/09/2026. La revisión del 21/09 cambia dinámica y valores iniciales. Las cifras de sensibilidad de este documento no corresponden al motor actual. Véase [fundamento revisado](model_rationale.md). El script actual genera un informe nuevo separado.

Fecha: 20 de septiembre de 2026. Alcance: motor web original, no todos los modelos
Python históricos. Esta es una evaluación del estado del proyecto, no un artículo
con resultados empíricos ni una garantía de aceptación editorial.

## Dictamen

El simulador constituye un prototipo exploratorio documentado. Permite preparar
la descripción del método y diseñar experimentos. Todavía no está preparado como
artículo empírico terminado ni como tesis completa. Una interfaz y una combinación
de mecanismos no demuestran una contribución científica nueva.

| Aspecto | Estado actual | Qué falta |
|---|---|---|
| Fórmulas → código | Pruebas de componentes y casos límite del motor real | Ampliar cobertura de combinaciones y revisión independiente |
| Documentación | Ecuaciones LaTeX, ejemplos, referencias y controles | ODD completo de esta versión, fijado a un commit |
| Fundamento | Antecedentes identificados; hipótesis propias diferenciadas | Justificar necesidad e identificabilidad de cada extensión |
| Robustez | Diagnóstico local ±0.01, 6 semillas | Sensibilidad global, interacciones, horizontes largos, tamaños y estados iniciales |
| Resultados sociales | No hay validación empírica de este motor | Datos definidos, ajuste, evaluación separada e incertidumbre |
| Novedad | No establecida | Revisión dirigida y comparación con las alternativas más próximas |
| Reproducibilidad | Semillas, motor y experimento local versionados | Exportación completa de configuración, calendario y series; réplica independiente |

## Auditoría realizada ahora

- Las 16 ecuaciones se componen desde LaTeX como MathML estático. No se necesita
  conexión a un CDN ni ejecutar una librería matemática en el navegador.
- Se conservan las ecuaciones de movimiento. Se mejora resolución de controles
  de 0.1 a 0.01, sin modificar sus valores iniciales.
- Se corrige el eje temporal del historial móvil: t=1000 y 900 muestras comienzan
  en t=101. Antes se etiquetaba como si todas las muestras comenzaran en cero.
- Se evita el recorte gráfico del JDJ a 1 cuando se acercan los polos. Con polos
  coincidentes, la fórmula admite 2; ese cambio geométrico no debe ocultarse.
- Se comprueban respuestas locales proporcionales, umbrales, pertenencias,
  fuerzas de eventos, masas, adaptación de tolerancia y límites. Las pruebas no
  demuestran equivalencia con una población real ni cobertura exhaustiva.

Resultado de verificación de esta revisión: 27 pruebas del motor web y 23 de
Python superadas; 16 ecuaciones LaTeX comprobadas frente a su salida estática.
Se comprobó en navegador la presentación matemática, el aviso de reinicio al
cambiar μ de 0.60 a 0.61, el reinicio y el avance del simulador.

### Cambios pequeños de parámetros

Ejecutar `node experiments/web_sensitivity.cjs` reproduce 78 ejecuciones: 80
agentes, 120 rondas, 6 semillas; configuración base y ±0.01 en seis controles.
Cada variante se empareja con la base usando la misma semilla. El experimento
guarda resultados individuales en `docs/web_sensitivity_results.json`.

| Control: incremento +0.01 | Cambio medio del JDJ final | Mínimo / máximo entre semillas |
|---|---:|---:|
| Fuerza polos | +0.001934 | +0.001338 / +0.002210 |
| Tolerancia inicial | −0.000137 | −0.000177 / −0.000084 |
| Susceptibilidad | +0.000385 | −0.000024 / +0.000957 |
| Ruido | −0.000861 | −0.001263 / −0.000435 |
| Cierre por radicalidad | −0.000125 | −0.000518 / +0.000138 |
| Fuerza de masa | −0.000615 | −0.000926 / −0.000401 |

Son diferencias absolutas de un índice, no porcentajes ni efectos causales en
personas. El mayor cambio absoluto considerando ambas direcciones fue 0.002825.
No son intervalos de confianza ni pruebas de significación. Seis semillas, una
región paramétrica y un horizonte corto no prueban estabilidad general.
El mínimo de grupo permanece en 20: al reducir N a 80 se modifica el umbral
relativo respecto de N=240. No extrapolar estos resultados a otros tamaños.
Los eventos pueden no aparecer en algunas ejecuciones cortas. No se aísla aquí
su efecto, ni se evalúa sensibilidad del calendario.

Un cambio pequeño puede producir una discontinuidad legítima cuando se incorpora
un vecino, se detecta un grupo, se supera α, se redondea una duración o se activa
el auditor. Los campos gaussianos son suaves pero su combinación con esas reglas
no tiene por qué serlo. El orden de semillas de detección de clusters también
puede importar en empates: la prueba de orden de actualización aísla la influencia
local y no demuestra invariancia de la detección completa.

## Primer artículo: acotar, no añadir mecanismos

Pregunta propuesta, aún no resultado: **¿qué aporta el acoplamiento polo–grupo a
la persistencia de la polarización frente a influencia individual y eventos?**

Estudiaría esa extensión con el auditor desactivado en el análisis principal:
el auditor responde a JDJ y fuerza un retorno, por lo que una caída del mismo
índice no sería evidencia independiente de un mecanismo social. Analizaría el
auditor por separado como intervención diseñada, sin ocultarlo.

Comparaciones sugeridas: base local + polos; base + eventos; base + masa;
base + masa + acoplamiento. Mantener constantes las otras reglas y comprobar
si la mejora persiste al variar detección de grupos, ruido y tolerancia.
Complementar JDJ con separación, distribución de opiniones y persistencia de
grupos. No equiparar JDJ=0.5 a dos bandos: también aparece en consenso central.
Si las extensiones no aportan capacidad explicativa o predictiva, ese es un
resultado posible; no añadir parámetros para forzar una conclusión favorable.

### Estructura orientativa del manuscrito

1. **Título y resumen:** problema, contribución acotada, método y resultados
   reales una vez obtenidos; no prometer realismo universal.
2. **Introducción:** pregunta, relevancia social y vacío concreto respaldado por revisión.
3. **Trabajos relacionados:** distinguir fórmulas reproducidas, adaptadas y propuestas.
4. **Modelo y métodos:** variables, unidades, ecuación final, orden temporal,
   aleatoriedad, inicialización, hipótesis y ODD en suplemento.
5. **Diseño experimental:** comparadores, ablaciones, parámetros, semillas,
   métricas, criterios de evaluación e incertidumbre definidos antes de analizar.
6. **Resultados:** efectos con dispersión e incertidumbre, no una animación elegida.
7. **Discusión:** mecanismos identificables, alternativas, límites y validez externa.
8. **Conclusiones:** respuesta delimitada; datos, código, versiones y materiales.

No es obligatorio usar datos reales para todo artículo teórico de simulación;
sin ellos el alcance debe ser teórico, con aportación nueva y resultados robustos.
Para afirmar ajuste a COVID sí hacen falta evaluación empírica y una definición
de qué observaciones corresponden a los estados y parámetros.

## Itinerario razonable de tesis

1. **Medición:** estudiar qué mide JDJ con pertenencias no complementarias,
   geometría de polos y consenso; compararlo con otras medidas y con etiquetas
   independientes. Resultado esperado: límites e interpretabilidad, no un índice
   nuevo por obligación.
2. **Mecanismos:** identificar cuándo masas, eventos y contraeventos aportan algo
   respecto de modelos más simples. Ablaciones, sensibilidad global y posible
   equifinalidad: parámetros distintos pueden producir las mismas curvas.
3. **Datos longitudinales:** conectar el calendario observado de COVID o elecciones
   con eventos; definir intensidad mediante observables. Ajustar en un período,
   evaluar en otro y, si es posible, en otro caso. Evitar utilizar resultados
   futuros para construir entradas pasadas. Tratar sesgos de plataforma y muestreo.
4. **Intervenciones:** comparar mecanismos transparentes sobre exposición o eventos
   bajo incertidumbre. Un contrafactual simulado depende del modelo; no demuestra
   por sí solo que una política funcione en la realidad.

Cada bloque necesita una pregunta y un aporte verificable. Una tesis no se vuelve
sólida por acumular sliders. Priorizaría medir y validar antes de añadir redes,
agentes lingüísticos u otras fuerzas. Las posibles publicaciones dependerán de
resultados, novedad y criterios de la universidad y revista, no solo del software.

## Apoyo metodológico

- Grimm y coautores (2020), [ODD, segunda actualización](https://www.jasss.org/23/2/7.html),
  DOI 10.18564/jasss.4259: estructura para describir modelos y favorecer réplica.
- Collins, Koehler y Lynch (2024), [Methods That Support the Validation of Agent-Based Models](https://www.jasss.org/27/1/11.html),
  DOI 10.18564/jasss.5258: validación acorde con el uso previsto; no sustituirla por tests.
- [One Size Does Not Fit All (2020)](https://www.jasss.org/23/1/6.html): sensibilidad
  elegida en función de preguntas y propósito. El barrido local presente no es
  un análisis global de sensibilidad.
