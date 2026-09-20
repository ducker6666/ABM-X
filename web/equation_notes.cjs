// Documentación, no motor: una ficha por ecuación de equations.cjs.
// «Razón» explica la estructura actual; no inventa la intención histórica del autor.
module.exports = {
  distancia: {
    symbols: [
      ['u, v', 'Dos posiciones que queremos comparar, por ejemplo dos personas. Cada posición contiene dos números.'],
      ['uₓ, uᵧ; vₓ, vᵧ', 'Coordenadas horizontal y vertical de cada posición. El subíndice indica qué coordenada leemos; no es una multiplicación.'],
      ['d(u,v)', 'Un solo número: distancia en línea recta entre las posiciones. Cero significa que coinciden. En el cuadrado [0,1]² llega hasta √2 ≈ 1.414214.'],
      ['√ y ²', 'Raíz cuadrada y elevar al cuadrado. La raíz deshace el cuadrado: √0.25 = 0.5.'],
      ['clip(z,l,h)', 'Limitar el número z entre el mínimo l (letra ele) y el máximo h, con l ≤ h. En el código se llama clamp. No es una teoría social.'],
      ['min y max', 'min elige el menor; max elige el mayor. Primero max(l,z) impide bajar de l; después min(h,…) impide superar h.'],
      ['[0,1]²; i; N', 'El cuadrado de pares (x,y) con ambas coordenadas entre 0 y 1; i identifica un agente; N es el número total de agentes.']
    ],
    example: 'Distancia: de (0.2,0.3) a (0.5,0.7), las diferencias son −0.3 y −0.4. Sus cuadrados son 0.09 y 0.16; suman 0.25; la raíz es 0.5. Recorte: clip(1.2,0,1)=1; clip(−0.2,0,1)=0; clip(0.6,0,1)=0.6. No se cambia lo que ya está dentro.',
    reason: 'La distancia resulta del teorema de Pitágoras aplicado a las dos diferencias. Elegirla supone que ambos ejes son comparables y pesan igual: eso debe justificarse al asignarles significado social. clip conserva el dominio elegido, pero puede acumular agentes en el borde; no representa una reflexión o rebote físico.',
    source: 'Definición geométrica estándar, no fórmula social inventada. Confianza acotada: [1], como antecedente del uso de distancias para seleccionar vecinos. La operación clip está documentada en [11]; esa referencia explica el recorte, no valida los límites elegidos.'
  },
  normal: {
    symbols: [
      ['U₁, U₂ ∼ U(0,1)', 'Dos sorteos uniformes independientes entre 0 y 1; ∼ se lee «se distribuye como». Para calcular ln, U₁ debe ser mayor que cero.'],
      ['ln, cos, π', 'Logaritmo natural, coseno (ángulo en radianes) y la constante pi ≈ 3.141593. Son funciones matemáticas, no parámetros sociales.'],
      ['Z', 'Sorteo normal estándar: distribución en forma de campana, simétrica alrededor de 0, con desviación 1. Valores cercanos al centro son más habituales que los muy alejados. No se limita al intervalo [0,1].'],
      ['X, m, s', 'X es el valor generado; m es la media antes del recorte (el promedio esperado al repetir muchos sorteos); s ≥ 0 es la desviación, una medida de dispersión en las mismas unidades que X. Mayor s: nube más ancha.'],
      ['floor(N/2)', 'Parte entera inferior de N/2. Si N=5, son 2 personas en la primera nube y 3 en la segunda.']
    ],
    example: 'Si U₁=exp(−0.5) y U₂=0.5, entonces √(−2 ln U₁)=1 y cos(π)=−1: Z=−1. Con m=0.28 y s=0.15, X=0.28−0.15=0.13. Otro sorteo Z=1 daría 0.43.',
    reason: 'Box–Muller transforma sorteos uniformes en normales. Las dos nubes iniciales permiten explorar un escenario con dos concentraciones. Sus centros y anchuras concretos no están estimados con datos ni son únicos. Recortar a [0.02,0.98] deja un margen inicial respecto a los bordes; cambia la distribución y no equivale a volver a sortear una normal truncada.',
    source: 'Transformación publicada: Box y Muller (1958), [9]. Dos nubes, reparto, medias, desviaciones y margen 0.02: decisiones experimentales propias; no se derivan de [9]. La justificación histórica de esos números no está documentada.'
  },
  vecinos: {
    symbols: [
      ['i, j; uᵢ, uⱼ', 'Persona estudiada, otra persona y sus respectivas posiciones al comienzo de la ronda.'],
      ['Nᵢ (caligráfica)', 'Conjunto de personas aceptadas como vecinas de i; no es el total N de la población.'],
      ['{j ≠ i : …}', 'Se lee «las personas j diferentes de i que cumplen la condición». Excluimos a la propia persona.'],
      ['‖uⱼ−uᵢ‖₂, εᵢ, ≤', 'Distancia euclídea, tolerancia individual y «menor o igual». Al estar justo en ε, el vecino sí entra.'],
      ['|Nᵢ|; Σⱼ∈Nᵢ', 'Número de vecinos; sumar las posiciones de todos los vecinos. Dividir por su número obtiene la media por coordenada.'],
      ['Lᵢ; (0,0)', 'Vector desde la posición propia a esa media; sin vecinos no propone ningún cambio.']
    ],
    example: 'Con vecinos (0.5,0.5) y (0.6,0.5), la media es (0.55,0.5). Desde (0.4,0.5), L=(0.15,0). El 0.15 no es todavía la distancia que se recorrerá.',
    reason: 'El radio representa una regla de aceptación por semejanza; la media da el mismo peso a cada vecino aceptado. Restar la posición actual convierte un destino en una dirección de cambio. El corte brusco y los pesos iguales son supuestos: no describen todas las formas reales de escuchar.',
    source: 'Antecedente: Hegselmann–Krause, [1]. Excluirse de la media y combinar el vector con otras fuerzas y velocidad es una adaptación del simulador, no la ecuación completa original.'
  },
  polos: {
    symbols: [
      ['k ∈ {A,B}; pₖ; uᵢ', 'k identifica uno de los dos polos; pₖ es su posición; uᵢ es la posición de la persona.'],
      ['S; ρ (rho)', 'Control Fuerza polos y escala Radio polos. ρ tiene mínimo efectivo 0.02 y no es un corte de alcance.'],
      ['zₖ; z*', 'zₖ es la puntuación negativa de distancia cuadrada dividida por 2ρ²; z* es la mayor de las dos puntuaciones. Se elimina q: la selectividad depende solo de ρ.'],
      ['eᶻ; wₖ', 'Exponencial de base e≈2.71828, no un evento. wₖ es el peso relativo del polo, entre 0 y 1; wA+wB=1.'],
      ['Tᵢ; P(uᵢ)', 'Tᵢ es el destino medio de los polos ponderados; P es el vector de fuerza calculado desde uᵢ.'],
      ['S(Tᵢ−uᵢ)', 'Se resta la posición actual al destino y se multiplica por S. No hay factor adicional por dominio de un polo.']
    ],
    example: 'En u=(0.2,0.2), con A=(0,1) y B=(1,0), las distancias empatan: wA=wB=0.5 y T=(0.5,0.5). Si S=0.7, P=0.7×(0.3,0.3)=(0.21,0.21). Si S=0.35, los pesos no cambian y la fuerza queda exactamente a la mitad.',
    reason: 'Supuestos explícitos: polos intercambiables, preferencia suave por cercanía y un destino que minimiza desacuerdo cuadrático ponderado. Con los pesos fijados en esta ronda, el mínimo de Σwₖ‖v−pₖ‖² se obtiene resolviendo 2Σwₖ(v−pₖ)=0: v=T. Se propone responder linealmente S(T−u). La gaussiana es una elección de familia de pesos, no la única posible. El 2 de 2ρ² fija la convención: a distancia ρ la afinidad sin normalizar es exp(−1/2)≈0.6065. S y ρ se estudian como parámetros, no como constantes humanas. No se afirma descenso de una energía global cuando los pesos se recalculan.',
    source: '[2] respalda estudiar señales persistentes, no esta regla gaussiana. [3] respalda únicamente la evaluación estable de softmax. La media se deriva algebraicamente bajo los supuestos indicados; la interpretación social aún requiere contraste. Se retiran q=1+6S y 0.35+0.65D porque añadían supuestos sin respaldo específico.'
  },
  calendario: {
    symbols: [
      ['f; g', 'Control Frecuencia eventos y separación nominal entre intentos, en rondas. f no es una probabilidad por ronda.'],
      ['cD; D; cI; I', 'Control de duración, duración efectiva entera, control de intensidad e intensidad efectiva al nacer.'],
      ['U(a,b); round', 'Sorteo uniforme entre a y b; redondeo al entero más cercano, con mitades hacia arriba para estos valores positivos.'],
      ['t; tprimero; tsiguiente', 'Ronda de creación actual, primer intento programado y siguiente intento programado.']
    ],
    example: 'f=0.7: g=30+round(970×0.3)=321. Si el multiplicador sorteado es 1, el siguiente intento será t+321. cD=0.4: D=20+72=92. cI=0.8 y sorteo 1.2: I=0.96.',
    reason: 'Las transformaciones convierten controles 0–1 en rondas: g recorre 1000 a 30 y D recorre 20 a 200. La variación uniforme evita intervalos siempre idénticos; el mínimo 8 evita intentos demasiado próximos. Son rangos de escenario. Además se espera a que termine el primario anterior; con f=0 no se crean eventos.',
    source: 'Eventos estocásticos en dinámica de opiniones: antecedente [4]. Este calendario y sus constantes son propios, no una estimación de frecuencias sociales ni un proceso Poisson.'
  },
  contraevento: {
    symbols: [
      ['Pr(respuesta | e); ccontra', 'Probabilidad de respuesta condicionada a que se cree un evento; ccontra es el control Contraevento.'],
      ['e=(eₓ,eᵧ); e′', 'Posición del evento y posición de su respuesta. La prima distingue la respuesta; no indica derivada.'],
      ['t₀, D, I; t′₀, D′, I′', 'Inicio, duración e intensidad del original y los correspondientes valores de la respuesta.']
    ],
    example: 'Desde e=(0.8,0.3), e′=(0.2,0.7). Si ccontra=0.4, cada primario tiene un 40% de probabilidad de generar esa respuesta: no significa que siempre responda ni que en diez eventos haya exactamente cuatro.',
    reason: 'La reflexión conserva distancia al centro y coloca la señal al otro lado del cuadrado. Retraso y menor intensidad construyen una respuesta posterior más débil. Es una hipótesis de escenario: al mover los polos, la reflexión no garantiza que la respuesta esté más cerca del polo rival.',
    source: 'No hay fuente identificada para esta regla exacta. [4] solo aporta el antecedente general de sucesos estocásticos. Los factores 0.65 y 0.55 y el retraso de 3 rondas son decisiones que deben contrastarse, no hechos sociales universales.'
  },
  eventos: {
    symbols: [
      ['cdec; H; t₀; D; t', 'Control de decaimiento, vida media, ronda de inicio, duración y ronda de evaluación. H no es aquí el anclaje Hᵢ.'],
      ['aₑ(t)', 'Amplitud relativa vigente: comienza en 1 y se reduce a la mitad cada H rondas, mientras dura el evento.'],
      ['e; v=e−uᵢ; d', 'Posición del evento; vector de la persona hacia él; longitud de ese vector con mínimo 0.02 para evitar divisiones por cero.'],
      ['ρₑ; K; I; R', 'Escala espacial, atenuación gaussiana, intensidad inicial y coeficiente de reactancia del evento.'],
      ['1{bandos distintos}', 'Indicador: vale 1 si el polo más cercano difiere y 0 si no. No es un sorteo.'],
      ['Eᵢₑ; Eᵢ; Σₑ', 'Aporte neto de un evento, suma de aportes a la persona y suma sobre todos los eventos. v/d conserva dirección con longitud a lo sumo 1 por el mínimo de d.']
    ],
    example: 'Si H=100 y el evento no ha caducado, a(100 rondas después)=2⁻¹=0.5 y a(200 después)=0.25. En la ronda t₀+D la amplitud ya es cero, aunque la exponencial por sí sola fuese positiva.',
    reason: 'Una pérdida proporcional a lo que queda conduce al decaimiento exponencial. La gaussiana reduce suavemente el alcance sin frontera abrupta. El primer vector atrae; el segundo resta una dirección hacia el evento, produciendo repulsión cuando el indicador está activo. Diferir de bando no demuestra por sí mismo reactancia psicológica.',
    source: 'Reactancia como fenómeno: [5]; eventos: [4]. La combinación radial, la elección gaussiana y mínimos/rangos son hipótesis operativas. La solución exponencial es matemática; identificarla con pérdida real de atención requiere datos.'
  },
  masa: {
    symbols: [
      ['k; i ∈ k; nₖ; N', 'Grupo, persona asignada al grupo, número de miembros y población total.'],
      ['cₖ', 'Centroide: promedio de las posiciones de los miembros. Aquí cₖ es un punto, no un deslizador.'],
      ['fₖ; γ; cγ; Mₖ', 'Proporción de población del grupo, exponente efectivo, control Exponente masa y masa numérica resultante.']
    ],
    example: 'Dos miembros en (0.2,0.4) y (0.4,0.6) tienen centro (0.3,0.5). Si son 2 de 10 personas, f=0.2. Con γ=1, M=0.2; con γ=2, M=0.04.',
    reason: 'La media minimiza la suma de distancias cuadradas a los miembros. Dividir nₖ por N expresa tamaño relativo; la potencia permite explorar cuánto se penalizan grupos pequeños. El rango γ=0.5…2 mantiene la masa entre 0 y 1, pero no convierte tamaño en poder social observado.',
    source: 'Media: definición aritmética. Búsqueda de centros: antecedente [6], no identidad con nuestro detector. Potencia de masa y rango del exponente: elecciones propias, pendientes de sensibilidad y contraste.'
  },
  grupos: {
    symbols: [
      ['vₖ; dₖ; cₖ; uᵢ', 'Vector hacia el centro del grupo, su distancia con mínimo 0.01, posición del centro y de la persona.'],
      ['ρg; b; Kₖ', 'Radio gravedad cluster, longitud de suavizado del denominador y atenuación gaussiana con distancia.'],
      ['Sg; Mₖ; hᵢₖ; cauto', 'Fuerza masa cluster, masa numérica, multiplicador según pertenencia y control Autoatracción.'],
      ['Cᵢ; Σₖ; i ∉ k', 'Vector total por masas; suma sobre grupos detectados; persona que no pertenece al grupo.']
    ],
    example: 'Si la contribución externa es (0.20,0), para un miembro con cauto=0.10 pasa a (0.02,0). Con cauto=0, su propio grupo no lo atrae por este término; otros grupos sí pueden hacerlo.',
    reason: 'La masa escala el aporte; la gaussiana reduce el efecto lejano y d²+b² evita una singularidad en el centro. Multiplicar por v hace que el aporte sea cero exactamente en el centro. Esto no es gravedad newtoniana: las unidades y la forma vectorial son distintas. La autoatracción permite controlar cuánto pesa el grupo propio, pero no mide cohesión empírica.',
    source: 'No se ha identificado una publicación para esta fuerza exacta. Es una interacción regularizada propuesta, con analogía física, no una ley sociológica. Las constantes 0.01, 0.02 y 0.18 deben tratarse como decisiones numéricas/experimentales y comprobar su influencia.'
  },
  acoplamiento: {
    symbols: [
      ['P(uᵢ); P(cₖ)', 'La misma función polar evaluada en la persona y en el centro de su grupo, respectivamente.'],
      ['κ; fₖ=nₖ/N; Pᵢ', 'Control Atracción polo-grupo, proporción de población del grupo y fuerza polar final. Este término no usa la masa elevada a γ de la gravedad.']
    ],
    example: 'Con κ=0.7 y un grupo de 20 de 100 personas, κf=0.7×0.2=0.14. Si P(c)=(0.10,0), se suma (0.014,0). Con κ=0 no hay aporte colectivo.',
    reason: 'Hipótesis opcional: cada miembro aporta una señal colectiva representada por el centro. Asignar a cada persona igual peso 1/N y sumar nₖ aportes κP(c)/N produce κ(nₖ/N)P(c). Esa derivación justifica el tamaño relativo, no demuestra que una comunidad real funcione así. Si persona y centro coinciden, equivale a amplificar la fuerza individual: se mantiene el control de ganancia en el protocolo.',
    source: 'Adaptación propia derivada de aditividad e igual peso por miembro; [2] solo aporta el antecedente de señales. No hay fuente atribuida para esta regla colectiva exacta. Desactivada de inicio y pendiente de contraste. Se elimina el suelo 0.35 y su complemento 0.65.'
  },
  tolerancia: {
    symbols: [
      ['rᵢ; √0.5', 'Distancia al centro normalizada: 0 en el centro y 1 en cualquier esquina. √0.5 es la distancia del centro a una esquina.'],
      ['εᵢ⁰; εᵢ', 'Tolerancia inicial individual y tolerancia efectiva de esta ronda. El superíndice 0 indica inicial, no elevar a cero.'],
      ['cr; cm; Mᵢ', 'Controles de cierre e inercia de masa; masa del grupo propio, o cero si no lo hay.']
    ],
    example: 'ε⁰=0.3, cr=0.4, r=0.5, cm=0.2, M=0.2: 0.3×0.8×0.96=0.2304. Si el producto es cero, ε=0: solo admite opiniones exactamente coincidentes. Se elimina el suelo anterior 0.01.',
    reason: 'Cada factor entre 0 y 1 reduce proporcionalmente la apertura inicial. El producto supone reducciones multiplicativas independientes; no es una consecuencia de HK. Estar lejos del centro geométrico no basta para diagnosticar radicalismo social. Ambos controles empiezan a cero para que la tolerancia base no imponga esa hipótesis.',
    source: '[7] estudia confianza acotada con red adaptativa, no esta ecuación ni la relación propuesta entre masa y tolerancia. Producto y definición de r son hipótesis propias todavía pendientes de contraste.'
  },
  atributos: {
    symbols: [
      ['ε̄; h; εᵢ⁰', 'Control de tolerancia media, heterogeneidad de tolerancia y valor inicial sorteado para la persona.'],
      ['cμ, cα, cλ; μᵢ, αᵢ, λᵢ', 'Valores exactos de los controles y atributos individuales de susceptibilidad, umbral y anclaje. Son iguales para toda la población al reiniciar; cero desactiva el término. μᵢ no es pertenencia a un polo.'],
      ['Zᵢ; h', 'Sorteo normal estándar y desviación relativa de tolerancia: σ=ε̄h. h=0 elimina esa heterogeneidad.']
    ],
    example: 'Con ε̄=0.3 y h=0.2, σ=0.06; un sorteo Z=1 da ε⁰=0.36. Con h=0, todas las personas empiezan con ε⁰=0.3. Con cμ=0.6, μᵢ=0.6, sin dispersión oculta.',
    reason: 'Se eliminan dispersiones fijas 0.08, 0.05 y 0.04 y el suelo 0.02 de susceptibilidad. La heterogeneidad de tolerancia se expresa respecto a su media para que el control tenga significado directo. La forma normal sigue siendo una hipótesis de distribución, desactivada de inicio. Tras recortar, la media efectiva puede diferir de ε̄.',
    source: 'Generación normal: [9]. Homogeneidad base y heterogeneidad relativa opcional son diseños experimentales explícitos, no estimaciones de una población real.'
  },
  jdj: {
    symbols: [
      ['aᵢ, bᵢ; pA, pB', 'Pertenencias de la persona a A y B y posiciones de los polos. aᵢ y bᵢ no son las coordenadas x e y.'],
      ['√2', 'Distancia máxima en el cuadrado: normaliza cada distancia antes de restarla de 1.'],
      ['Pᵢⱼ; max', 'Contribución del par: el mayor de los dos productos cruzados de pertenencias. No es la fuerza polar P(u).'],
      ['N; ΣᵢΣⱼ; 2/N²', 'Número de agentes, suma de todos los pares ordenados (incluido consigo mismo) y factor de escala del índice.']
    ],
    example: 'Dos personas exactamente en polos opuestos tienen pertenencias (1,0) y (0,1). Los cuatro pares dan 0,1,1,0. Su suma es 2 y el factor es 2/4: JDJ=1.',
    reason: 'Las pertenencias crecen al acercarse a cada referencia; los productos cruzados describen oposición difusa entre pares. Dividir por N² promedia pares; el factor 2 fija la escala: dos mitades en polos opuestos dan 1. No implica que cualquier configuración o polos movidos quede en [0,1]. La población vacía devuelve 0 por convención de código para evitar dividir por cero.',
    source: 'Antecedente difuso: Guevara Gil y coautores, [8]. La especificación euclídea bidimensional aquí documentada no se presenta como validación empírica de ese capítulo. No se afirma una atribución literal de toda la composición sin cotejar su formulación; se distingue antecedente de implementación.'
  },
  auditor: {
    symbols: [
      ['bᵢ; m; B; V', 'Pertenencia a B, su media, diagnóstico de balance y cuatro veces su varianza poblacional. Aquí B es un número, no la posición del polo.'],
      ['qₜ; qₜ₋₁; θJ; θB; ∧', 'Contador actual y previo de rondas consecutivas, umbrales de JDJ y balance, y «ambas condiciones a la vez». q inicial es cero.'],
      ['cτ; τ; Sc; Rᵢ', 'Control de paciencia, rondas exigidas, fuerza centro y vector de intervención. Rᵢ no es el coeficiente R de reactancia.']
    ],
    example: 'Para b=(0,1), m=0.5, B=4×0.5×0.5=1 y V=4×(0.25+0.25)/2=1. Para b=(0.5,0.5), B sigue siendo 1 pero V=0: balance no distingue esos casos.',
    reason: '4m(1−m) vale 1 en m=0.5 y 0 en los extremos. La varianza describe dispersión, no sus causas. La paciencia exige persistencia de la alarma; fallar una condición borra el contador. La flecha al centro equivale a descender una penalización cuadrática de distancia al centro. Decidir que eso es socialmente deseable es una elección normativa, no una conclusión del índice.',
    source: 'Identidades algebraicas y definición de varianza; señales comunes como antecedente [2]. Umbrales, 119, contador y política de recentrado: propuesta propia. No hay una fuente que establezca que ese JDJ deba activar esa intervención.'
  },
  movimiento: {
    symbols: [
      ['uᵢ(0); uᵢ(t); uᵢ(t+1)', 'Posición inicial, posición al empezar la ronda y posición en la siguiente.'],
      ['Hᵢ; λᵢ', 'Vector de retorno a la opinión inicial y su coeficiente. Hᵢ no es vida media del evento.'],
      ['Lᵢ, Pᵢ, Eᵢ, Cᵢ, Rᵢ; Fᵢ', 'Vecinos, polos con acoplamiento, eventos, masas y auditor; Fᵢ es la suma de esos vectores y el anclaje.'],
      ['μᵢ; αᵢ; ‖Fᵢ‖₂', 'Susceptibilidad, umbral de respuesta y longitud euclídea de la fuerza total. En igualdad con α no hay respuesta dirigida.'],
      ['ξᵢ; N(0,σ²); cruido', 'Vector de ruido, distribución normal de media 0 y varianza σ², y control de ruido; σ=0.012×cruido por eje.'],
      ['vᵢ; v̂ᵢ; clip', 'Desplazamiento propuesto, desplazamiento con longitud limitada y recorte final por coordenada. El acento distingue antes/después del límite.']
    ],
    example: 'Un desplazamiento propuesto (0.06,0.08) tiene longitud 0.10. El máximo 0.05 lo multiplica por 0.5: queda (0.03,0.04). Desde (0.99,0.5) propone (1.02,0.54), pero clip devuelve (1,0.54); el avance real es (0.01,0.04).',
    reason: 'Sumar vectores permite efectos simultáneos y compensación. Multiplicar por 0.075μ produce un avance parcial; el umbral representa una barrera de respuesta. Ruido, límite de longitud y recorte son etapas diferentes. El anclaje tira hacia el inicio, no necesariamente hacia moderación. Esta construcción es explícita y comprobable, pero no se deduce como una ley social única.',
    source: 'Promedio: [1]; persistencia de opinión inicial: [10]; generación de ruido: [9]; recorte: [11]. La suma, umbral, paso 0.075, límite 0.05 y escala 0.012 son decisiones del modelo. No hay calibración presentada que les asigne días o intensidades sociales reales.'
  },
  intensidad: {
    symbols: [
      ['Ivisible(t); aₑ(t); Iₑ; Σₑ; min', 'Valor del gráfico, amplitud vigente del evento, intensidad inicial de cada evento, suma de eventos y elección del menor valor.']
    ],
    example: 'Dos eventos con aportaciones 0.8 y 0.5 suman 1.3. El gráfico muestra min(1,1.3)=1. No se rebajan sus fuerzas en el motor por ese motivo.',
    reason: 'Es una saturación de presentación para mantener la escala del gráfico. Oculta diferencias por encima de 1 y debe recordarse al interpretar picos. No es otra regla social ni un indicador validado de atención pública.',
    source: 'Operación matemática min y decisión de visualización propia; no se atribuye a una teoría publicada.'
  }
};
