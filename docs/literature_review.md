# Revision reproducible de literatura

Fecha: 2026-06-20.

## Metodologia

Se siguio una revision rapida reproducible, no exhaustiva. Se registraron consultas en `references/search_log.csv`, con inclusion de fuentes primarias cuando estaban disponibles. Bases no accesibles con autenticacion institucional: Web of Science, Scopus, Dimensions, IEEE Xplore, ACM Digital Library, SIAM, Wiley, Taylor & Francis, Cambridge y Oxford. Google Scholar se considero no reproducible por bloqueo y personalizacion; se uso solo como pista, no como evidencia primaria.

## Articulo Batista-Barallobre

Batista-Barallobre (2025), `Emergencia social en sistemas adaptativos complejos`, es una revision general PRISMA de 66 estudios sobre emergencia social y simulacion basada en agentes. Es util como marco de ABM/SAC, pero no es una revision exhaustiva de dinamica de opiniones ni de polarizacion politica. La pagina declara publicacion el 2025-08-24; dado que la fecha actual del entorno es 2026-06-20, se trato como fuente reciente disponible.

## Familias de modelos

| Modelo | Estado del agente | Interaccion | Regla de actualizacion | Red | Resultado tipico | Relacion con el codigo |
|---|---|---|---|---|---|---|
| Vicsek | Posicion y direccion | Vecinos metricos en radio fisico | Alinea direccion media circular + ruido | Toro/espacio metrico | Transicion desorden-alineamiento | Coincidencia directa |
| DeGroot | Opinion continua | Matriz estocastica fija | Promedio ponderado lineal | Red fija | Consenso bajo conectividad | No coincide |
| Friedkin-Johnsen | Opinion actual + prejuicio inicial | Influencia social ponderada | Promedio con anclaje/obstinacion | Red fija | Consenso parcial, persistencia de diferencias | Antecedente de `lambda_i` |
| Deffuant-Weisbuch | Opinion continua | Parejas aleatorias si distancia menor que epsilon | Compromiso parcial con `mu` | Completa o red | Consenso o clusters | Buen modelo alternativo |
| Hegselmann-Krause | Opinion continua | Todos los vecinos dentro de epsilon | Media local sincronica | Completa o red | Consenso, fragmentacion | Modelo base recomendado |
| Axelrod | Vectores culturales discretos | Homofilia local | Copia un rasgo con probabilidad proporcional a similitud | Grilla/red | Polarizacion cultural por regiones | Parcial, multidimensional discreto |
| CODA | Opinion latente continua, accion discreta | Observacion de acciones vecinas | Actualizacion bayesiana/log-odds | Red | Extremismo local | Antecedente para opinion latente y memoria |
| Voter | Estado discreto | Copia vecino | Imitacion estocastica | Red | Consenso por fluctuaciones | No coincide |
| Sznajd | Estado discreto | Pares influyen vecinos | Validacion social | Lattice/red | Consenso/estados alternantes | No coincide |
| Impacto social | Opinion/actitud y fuerzas | Influencia por fuerza, distancia, numero | Campo social neto | Espacial/red | Clusters, minorias | Antecedente conceptual de fuerzas |
| Bounded confidence heterogeneo/adaptativo | Opinion continua + epsilon_i(t) | Vecinos dentro de limites individuales | HK/DW con confianza variable | Red | Clusters, tiempos largos | Cubre parte de 3.5 y 3.6 |
| Influencia negativa/asimilacion-contraste | Opinion continua | Atraccion cercana, repulsion lejana | Movimiento hacia/lejos | Red/metrica | Polarizacion | Cubre repulsion |
| Campos externos/medios | Opinion continua/discreta | Influencia exogena | Termino externo | Red | Sesgo, radicalizacion, consenso inducido | Cubre polos/eventos parcialmente |
| Orden superior/hipergrafos | Opinion continua | Grupos/hyperedges | Discusion grupal/promedio de grupo | Hipergrafo | Cambia transiciones | Cubre clusters mesoscopicos parcialmente |
| Eventos estocasticos | Opinion continua | Shocks temporales | Eventos desplazan opiniones o tolerancia | Red/poblacion | Clustering/polarizacion sostenida | Cubre 3.3 parcialmente |
| Markov PMMC | Distribucion actitudinal discreta | Transiciones probabilisticas | Cadena absorbente | No red social | Riesgo de llegar a estados polarizados | Relacion con scripts Markov, no con Vicsek |

## Sintesis

El punto de partida mas defendible para polarizacion en redes sociales no es Vicsek. HK ofrece interpretabilidad sincronica y confianza acotada; Deffuant ofrece microinteracciones pairwise; Friedkin-Johnsen aporta anclaje; asimilacion-contraste e influencia negativa aportan repulsion; modelos con medios/eventos e hipergrupos aportan mecanismos exogenos y mesoscopicos.

La implementacion final se baso en cinco antecedentes directos: HK para confianza acotada; FJ para obstinacion/anclaje; Hegselmann-Krause 2015 para senales constantes/radicales; Condie y Condie 2021 para eventos estocasticos capaces de sostener clustering/polarizacion; Kan-Feng-Porter 2023 y literatura relacionada para adaptacion/co-evolucion de confianza/red. Se descarto Vicsek como modelo sustantivo de opinion politica.

## Fuentes verificadas usadas como soporte

Las referencias verificadas estan en `references/references.bib`. Las afirmaciones sobre Vicsek, HK, DW, FJ, Axelrod, Castellano, JDJ/PMMC, confianza adaptativa, influencia negativa, eventos e hipergrupos se apoyan en DOI/URL persistentes registrados alli.
