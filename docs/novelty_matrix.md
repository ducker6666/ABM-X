# Matriz de antecedentes y novedad

Escala: 0 no localizado en la busqueda realizada; 1 antecedente lejano; 2 mecanismo parcialmente equivalente; 3 antecedente muy proximo; 4 propuesta ya implementada practicamente igual.

| Mecanismo | Existe | Referencia primaria | Ecuacion existente | Diferencia con propuesta | Solapamiento | Oportunidad de novedad |
|---|---|---|---|---|---:|---|
| umbral de inmovilidad | existen antecedentes parciales | Friedkin-Johnsen; modelos threshold | No unica | Separar de tolerancia y obstinacion | 2 | aparentemente poco explorado si se combina con JDJ local |
| tolerancia | propuesta ya cubierta por la literatura | HK; DW | `|x_i-x_j|<=epsilon` | Heterogenea/adaptativa | 4 | baja salvo acoplamientos nuevos |
| susceptibilidad | propuesta ya cubierta por la literatura | DW; FJ | `mu`, susceptibilidad | Separacion semantica | 4 | baja |
| obstinacion | propuesta ya cubierta por la literatura | Friedkin-Johnsen | anclaje a opinion inicial | Usar `lambda_i` heterogeneo | 4 | baja |
| radio heterogeneo | propuesta ya cubierta por la literatura | Lorenz; BCM adaptativos | `epsilon_i` | Aplicacion con JDJ | 4 | moderada |
| radio adaptativo | existen antecedentes parciales | BCM adaptive confidence | `epsilon_i(t+1)=f(...)` | Dependencia de JDJ/percepcion | 3 | buena si se formaliza y valida |
| distancia al polo | existen antecedentes parciales | modelos con extremos/medios | Campo externo | Polos permanentes en `[0,1]^d` | 2 | moderada |
| polos permanentes | propuesta ya cubierta por la literatura | stubborn agents, media | Termino fijo | Dos polos actitudinales | 3 | baja-media |
| eventos temporales | existen antecedentes parciales | stochastic events BCM | Shock temporal | Parametrizacion completa | 3 | media |
| decaimiento de eventos | existen antecedentes parciales | Hawkes/event decay | kernels temporales | Aplicacion a opinion/JDJ | 2 | media |
| fatiga | no localizado en la busqueda realizada como JDJ endogeno | opinion fatigue dispersa | No unica | Fatiga social con tolerancia | 1 | aparentemente poco explorado |
| reaccion contraria | existen antecedentes parciales | negative influence; countermobilization | repulsion | Evento genera repulsion | 2 | media |
| eventos que generan contraeventos | existen antecedentes parciales | Hawkes, protest-counterprotest | intensidad auto/excito | Rama opositora por JDJ | 2 | alta, novedad no puede asegurarse todavia |
| media local | propuesta ya cubierta | HK | promedio vecinos | Ninguna | 4 | baja |
| mediana local | existen antecedentes parciales | robust opinion aggregation | mediana | Robustez | 2 | media |
| mediana geometrica | no localizado en la busqueda realizada | robust statistics | minimiza suma distancias | Multidimensional robusta | 1 | aparentemente poco explorado |
| clusters con masa | existen antecedentes parciales | higher-order/hypergraph, node weights | pesos/grupos | Masa, centralidad, visibilidad | 2 | media |
| influencia sin contacto directo | propuesta ya cubierta | media/external field | campo externo | Eventos/polos | 3 | baja |
| influencia de identidad | existen antecedentes parciales | Axelrod, affective polarization | identidad/homofilia | Acoplar a tolerancia | 2 | media |
| influencia ambiental | propuesta ya cubierta | social impact/media | campo | Eventos | 3 | baja |
| polarizacion global | propuesta ya cubierta como medida | JDJ, ER, modularidad | indice | Endogeneizarla | 2 | media |
| polarizacion local experimentada | existen antecedentes parciales | perceived/experienced polarization | subred local | JDJ local individual | 2 | alta |
| retroalimentacion de polarizacion sobre tolerancia | existen antecedentes parciales | adaptive confidence | feedback | Usar JDJ global/local | 2 | alta |
| polarizacion estructural vs ideologica | existen antecedentes parciales | network polarization/modularity | `Q` vs opinion | Modelo dinamico conjunto | 2 | alta |
| transicion episodica a estructural | no localizado en la busqueda realizada | metastability/regime switching | HMM/regimenes | Opinion + eventos + red | 1 | alta |
| recuperacion del centro | existen antecedentes parciales | repulsion/fatigue/noise | mecanismo especifico | Distinguir cancelacion vs atraccion | 2 | media |
| ciclos de polarizacion | existen antecedentes parciales | oscillatory opinion dynamics | ciclos/no linealidad | Fatiga-eventos-JDJ | 2 | media-alta |
| JDJ como medida de salida | propuesta ya cubierta | Guevara et al. | JDJ | Medicion | 4 | baja |
| JDJ como variable endogena | no localizado en la busqueda realizada | PMMC/JDJ | No localizado | Feedback micro | 1 | alta |
| JDJ local | no localizado en la busqueda realizada | JDJ + local polarization | No localizado | Vecindad individual | 1 | alta |
| JDJ para calibracion | no localizado en la busqueda realizada | calibracion ABM generica | distancia objetivo | Usar series JDJ | 1 | media |
| JDJ para validacion | existen antecedentes parciales | estudios Twitter/JDJ | comparacion salida-dato | Validacion dinamica | 2 | media |

La novedad no puede asegurarse todavia. Lo mas prometedor es una combinacion estrecha: JDJ global/local como variable endogena que modifica confianza individual, con eventos temporales y posible transicion de polarizacion episodica a estructural.
